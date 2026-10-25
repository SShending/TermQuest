import { describe, expect, it } from "vitest";
import {
  formatGitStatus,
  inspectGitStatus,
  stageAll,
  stagePath,
  unstagePath,
} from "./gitRepository";
import { createGitWorkspaceRepository } from "./initialStates";

describe("virtual Git index", () => {
  it("stages a tracked modification without duplicating it as unstaged", () => {
    const staged = stagePath(createGitWorkspaceRepository(), "login.py");

    expect(staged.ok).toBe(true);
    if (!staged.ok) {
      throw new Error(staged.error.message);
    }
    expect(staged.changed).toBe(true);
    expect(inspectGitStatus(staged.repository)).toEqual({
      branch: "main",
      staged: ["login.py"],
      modified: ["debug.log"],
      untracked: ["test_output.txt"],
    });
  });

  it("tracks an untracked file as a staged addition and can restore it", () => {
    const added = stagePath(createGitWorkspaceRepository(), "test_output.txt");
    if (!added.ok) {
      throw new Error(added.error.message);
    }

    expect(formatGitStatus(added.repository)).toContain("new file:   test_output.txt");

    const restored = unstagePath(added.repository, "test_output.txt");
    if (!restored.ok) {
      throw new Error(restored.error.message);
    }

    expect(restored.repository).toEqual(createGitWorkspaceRepository());
  });

  it("stages every changed and untracked path with stageAll", () => {
    const result = stageAll(createGitWorkspaceRepository());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(inspectGitStatus(result.repository)).toEqual({
      branch: "main",
      staged: ["login.py", "debug.log", "test_output.txt"],
      modified: [],
      untracked: [],
    });
  });

  it("formats tracked staged changes as modified and untracked additions as new files", () => {
    const login = stagePath(createGitWorkspaceRepository(), "login.py");
    if (!login.ok) {
      throw new Error(login.error.message);
    }
    const both = stagePath(login.repository, "test_output.txt");
    if (!both.ok) {
      throw new Error(both.error.message);
    }

    const output = formatGitStatus(both.repository);
    expect(output).toContain("modified:   login.py");
    expect(output).toContain("new file:   test_output.txt");
    expect(output).toContain("modified:   debug.log");
  });

  it("rejects unknown paths and untracked unstaged restores without mutation", () => {
    const repository = createGitWorkspaceRepository();
    const missing = stagePath(repository, "missing.py");
    const unstaged = unstagePath(repository, "test_output.txt");

    expect(missing.ok).toBe(false);
    expect(unstaged.ok).toBe(false);
    expect(repository).toEqual(createGitWorkspaceRepository());
  });
});
