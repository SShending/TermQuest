import { describe, expect, it } from "vitest";
import { inspectGitStatus } from "../simulator/gitRepository";
import { createGitWorkspaceRepository } from "../simulator/initialStates";
import {
  createMissionSession,
  resetSession,
  revealNextHint,
  submitCommand,
  type GameSession,
} from "./engine";
import { GIT_01, GIT_02 } from "./mission";

function outputEntries(session: GameSession) {
  return session.terminal.filter((entry) => entry.kind === "output");
}

function systemEntries(session: GameSession) {
  return session.terminal.filter((entry) => entry.kind === "system");
}

describe("GIT-01 mission engine", () => {
  it("starts with an unfinished mission and the documented repository state", () => {
    const session = createMissionSession("GIT-01");

    expect(session.status).toBe("not_started");
    expect(session.observations).toEqual([]);
    expect(session.commandsRun).toBe(0);
    expect(session.repository).toEqual(createGitWorkspaceRepository());
  });

  it("completes only after a successful status inspection", () => {
    const session = submitCommand(createMissionSession("GIT-01"), "git status");

    expect(session.status).toBe("completed");
    expect(session.observations).toHaveLength(1);
    expect(session.commandsRun).toBe(1);
    expect(GIT_01.isComplete(session.repository, session.observations)).toBe(true);
    expect(outputEntries(session).at(-1)?.content).toContain("On branch main");
  });

  it("completes a normalized command that went through parser and executor", () => {
    const session = submitCommand(createMissionSession("GIT-01"), "  git    status ");

    expect(session.status).toBe("completed");
    expect(session.commandHistory).toEqual(["git    status"]);
  });

  it("does not complete on unknown, malformed, empty, or out-of-scope input", () => {
    const unknown = submitCommand(createMissionSession("GIT-01"), "pwd");
    const malformed = submitCommand(createMissionSession("GIT-01"), "git status | wc -l");
    const empty = submitCommand(createMissionSession("GIT-01"), "   ");
    const outOfScope = submitCommand(createMissionSession("GIT-01"), "git add login.py");

    expect(unknown.status).toBe("in_progress");
    expect(malformed.status).toBe("in_progress");
    expect(empty.status).toBe("not_started");
    expect(outOfScope.status).toBe("in_progress");
    expect(unknown.repository).toEqual(createGitWorkspaceRepository());
    expect(malformed.repository).toEqual(createGitWorkspaceRepository());
    expect(outOfScope.repository).toEqual(createGitWorkspaceRepository());
    expect(empty.commandsRun).toBe(0);
  });

  it("keeps repeated status checks consistent without mutating the repository", () => {
    const first = submitCommand(createMissionSession("GIT-01"), "git status");
    const second = submitCommand(first, "git status");
    const outputs = outputEntries(second);

    expect(second.status).toBe("completed");
    expect(outputs).toHaveLength(2);
    expect(outputs[0]?.content).toBe(outputs[1]?.content);
    expect(second.repository).toEqual(first.repository);
  });

  it("reveals hints in order without completing the mission", () => {
    const first = revealNextHint(createMissionSession("GIT-01"), GIT_01);
    const second = revealNextHint(first, GIT_01);
    const third = revealNextHint(second, GIT_01);
    const fourth = revealNextHint(third, GIT_01);

    expect(first.hintLevel).toBe(1);
    expect(second.hintLevel).toBe(2);
    expect(third.hintLevel).toBe(3);
    expect(fourth.hintLevel).toBe(3);
    expect(fourth.hintsUsed).toBe(3);
    expect(third.status).toBe("not_started");
    expect(third.observations).toEqual([]);
  });

  it("resets all mission progress and supports a fresh completion", () => {
    const hinted = revealNextHint(createMissionSession("GIT-01"), GIT_01);
    const completed = submitCommand(hinted, "git status");
    const reset = resetSession(completed);

    expect(reset).toEqual(createMissionSession("GIT-01"));
    expect(reset.missionId).toBe("GIT-01");
    expect(reset.status).toBe("not_started");
    expect(reset.commandHistory).toEqual([]);
    expect(reset.hintLevel).toBe(0);
    expect(reset.observations).toEqual([]);

    const replayed = submitCommand(reset, "git status");
    expect(replayed.status).toBe("completed");
    expect(replayed.commandsRun).toBe(1);
  });
});

describe("GIT-02 mission engine", () => {
  it("starts incomplete with the shared dirty workspace", () => {
    const session = createMissionSession("GIT-02");

    expect(session.status).toBe("not_started");
    expect(session.repository).toEqual(createGitWorkspaceRepository());
    expect(GIT_02.isComplete(session.repository, session.observations)).toBe(false);
  });

  it("does not complete after staging the wrong tracked file or everything", () => {
    const debug = submitCommand(createMissionSession("GIT-02"), "git add debug.log");
    const all = submitCommand(createMissionSession("GIT-02"), "git add .");

    expect(debug.status).toBe("in_progress");
    expect(all.status).toBe("in_progress");
    expect(GIT_02.isComplete(debug.repository, debug.observations)).toBe(false);
    expect(GIT_02.isComplete(all.repository, all.observations)).toBe(false);
    expect(systemEntries(debug).at(-1)?.content).toContain("[sandbox] 已暂存 debug.log");
  });

  it("can recover from the wrong staging choice and then complete", () => {
    const wrong = submitCommand(createMissionSession("GIT-02"), "git add debug.log");
    const restored = submitCommand(wrong, "git restore --staged debug.log");
    const completed = submitCommand(restored, "git add login.py");

    expect(restored.status).toBe("in_progress");
    expect(restored.repository).toEqual(createGitWorkspaceRepository());
    expect(completed.status).toBe("completed");
    expect(inspectGitStatus(completed.repository)).toEqual({
      branch: "main",
      staged: ["login.py"],
      modified: ["debug.log"],
      untracked: ["test_output.txt"],
    });
  });

  it("allows inspection but blocks further mutations after completion", () => {
    const completed = submitCommand(createMissionSession("GIT-02"), "git add login.py");
    const blocked = submitCommand(completed, "git add debug.log");
    const inspected = submitCommand(blocked, "git status");

    expect(completed.status).toBe("completed");
    expect(blocked.status).toBe("completed");
    expect(blocked.repository).toEqual(completed.repository);
    expect(blocked.terminal.at(-1)?.content).toContain("[command_not_available]");
    expect(inspected.status).toBe("completed");
    expect(inspected.terminal.at(-1)?.content).toContain("Changes to be committed:");
  });

  it("tracks hints independently and never completes by revealing them", () => {
    const first = revealNextHint(createMissionSession("GIT-02"), GIT_02);
    const second = revealNextHint(first, GIT_02);

    expect(second.hintLevel).toBe(2);
    expect(second.hintsUsed).toBe(2);
    expect(second.status).toBe("not_started");
  });

  it("resets GIT-02 back to its own initial state and supports replay", () => {
    const completed = submitCommand(createMissionSession("GIT-02"), "git add login.py");
    const reset = resetSession(completed);

    expect(reset.missionId).toBe("GIT-02");
    expect(reset).toEqual(createMissionSession("GIT-02"));
    expect(submitCommand(reset, "git add login.py").status).toBe("completed");
  });
});
