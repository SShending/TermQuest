import { describe, expect, it } from "vitest";
import { createGitWorkspaceRepository } from "../simulator/initialStates";
import { inspectGitStatus } from "../simulator/gitRepository";
import { executeCommand, type CommandAccess } from "./execute";

const GIT_01_ACCESS: CommandAccess = { allowedCommands: ["git-status"] };
const GIT_02_ACCESS: CommandAccess = {
  allowedCommands: ["git-status", "git-add", "git-restore-staged"],
};

describe("executeCommand", () => {
  it("returns the deterministic repository status", () => {
    const repository = createGitWorkspaceRepository();
    const result = executeCommand("git status", repository, GIT_01_ACCESS);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.observation?.snapshot).toEqual({
      branch: "main",
      staged: [],
      modified: ["login.py", "debug.log"],
      untracked: ["test_output.txt"],
    });
    expect(result.output).toContain("On branch main");
    expect(result.output).toContain("Changes not staged for commit:");
    expect(result.output).toContain("modified:   login.py");
    expect(result.output).toContain("modified:   debug.log");
    expect(result.output).toContain("Untracked files:");
    expect(result.output).toContain("test_output.txt");
    expect(result.output).toContain("no changes added to commit");
    expect(result.output).not.toContain("Changes to be committed:");
  });

  it("keeps repeated status checks read-only and identical", () => {
    const repository = createGitWorkspaceRepository();
    const snapshotBefore = structuredClone(repository);

    const first = executeCommand("git status", repository, GIT_01_ACCESS);
    const second = executeCommand("git status", repository, GIT_01_ACCESS);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      throw new Error("Expected both status commands to succeed");
    }

    expect(second.output).toBe(first.output);
    expect(second.observation).toEqual(first.observation);
    expect(repository).toEqual(snapshotBefore);
  });

  it("rejects git add in GIT-01 without mutating the repository", () => {
    const repository = createGitWorkspaceRepository();
    const snapshotBefore = structuredClone(repository);
    const result = executeCommand("git add login.py", repository, GIT_01_ACCESS);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("command_not_available");
    }
    expect(result.repository).toEqual(snapshotBefore);
  });

  it("stages only login.py and reports it as a staged modification", () => {
    const repository = createGitWorkspaceRepository();
    const added = executeCommand("git add login.py", repository, GIT_02_ACCESS);

    expect(added.ok).toBe(true);
    if (!added.ok) {
      throw new Error(added.error.message);
    }

    expect(added.output).toBe("");
    expect(added.notice).toContain("已暂存 login.py");
    expect(inspectGitStatus(added.repository)).toEqual({
      branch: "main",
      staged: ["login.py"],
      modified: ["debug.log"],
      untracked: ["test_output.txt"],
    });

    const status = executeCommand("git status", added.repository, GIT_02_ACCESS);
    expect(status.ok).toBe(true);
    if (status.ok) {
      expect(status.output).toContain("Changes to be committed:");
      expect(status.output).toContain("modified:   login.py");
      expect(status.output).not.toContain("new file:   login.py");
    }
  });

  it("stages an untracked file as a new file", () => {
    const repository = createGitWorkspaceRepository();
    const added = executeCommand("git add test_output.txt", repository, GIT_02_ACCESS);

    expect(added.ok).toBe(true);
    if (!added.ok) {
      throw new Error(added.error.message);
    }

    const status = executeCommand("git status", added.repository, GIT_02_ACCESS);
    expect(status.ok).toBe(true);
    if (status.ok) {
      expect(status.output).toContain("Changes to be committed:");
      expect(status.output).toContain("new file:   test_output.txt");
      expect(status.output).not.toContain("Untracked files:");
      expect(status.output.match(/test_output\.txt/g)).toHaveLength(1);
    }
  });

  it("supports git add . while keeping every resulting status coherent", () => {
    const repository = createGitWorkspaceRepository();
    const added = executeCommand("git add .", repository, GIT_02_ACCESS);

    expect(added.ok).toBe(true);
    if (!added.ok) {
      throw new Error(added.error.message);
    }

    expect(inspectGitStatus(added.repository)).toEqual({
      branch: "main",
      staged: ["login.py", "debug.log", "test_output.txt"],
      modified: [],
      untracked: [],
    });
  });

  it("restores a staged path without discarding its working tree change", () => {
    const repository = createGitWorkspaceRepository();
    const staged = executeCommand("git add debug.log", repository, GIT_02_ACCESS);
    if (!staged.ok) {
      throw new Error(staged.error.message);
    }

    const restored = executeCommand(
      "git restore --staged debug.log",
      staged.repository,
      GIT_02_ACCESS,
    );
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      throw new Error(restored.error.message);
    }

    expect(restored.repository).toEqual(repository);
    expect(restored.notice).toContain("已从暂存区移除 debug.log");
  });

  it("returns environment errors without mutating state", () => {
    const repository = createGitWorkspaceRepository();
    const missing = executeCommand("git add missing.py", repository, GIT_02_ACCESS);
    const notStaged = executeCommand(
      "git restore --staged test_output.txt",
      repository,
      GIT_02_ACCESS,
    );

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("path_not_found");
    }
    expect(notStaged.ok).toBe(false);
    if (!notStaged.ok) {
      expect(notStaged.error.code).toBe("path_not_staged");
    }
    expect(missing.repository).toEqual(repository);
    expect(notStaged.repository).toEqual(repository);
  });

  it.each([
    "pwd",
    "git status --short",
    "git status | wc -l",
    "git status > result.txt",
    "git add login.py debug.log",
    "git add ../login.py",
  ])("rejects %s without mutating the virtual repository", (input) => {
    const repository = createGitWorkspaceRepository();
    const snapshotBefore = structuredClone(repository);
    const result = executeCommand(input, repository, GIT_02_ACCESS);

    expect(result.ok).toBe(false);
    expect(result.repository).toEqual(snapshotBefore);
    expect(repository).toEqual(snapshotBefore);
  });

  it("handles empty input safely", () => {
    const repository = createGitWorkspaceRepository();
    const result = executeCommand("   ", repository, GIT_02_ACCESS);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("empty_input");
    }
    expect(repository).toEqual(createGitWorkspaceRepository());
  });
});
