import type { GitRepositoryState } from "../simulator/gitRepository";
import { executeCommand, type GameObservation } from "../terminal/execute";
import { MISSIONS, type MissionDefinition, type MissionId } from "./mission";

export type MissionStatus = "not_started" | "in_progress" | "completed";

export type TerminalEntryKind = "system" | "command" | "output" | "error";

export interface TerminalEntry {
  readonly id: number;
  readonly kind: TerminalEntryKind;
  readonly content: string;
}

export interface GameSession {
  readonly missionId: MissionId;
  readonly status: MissionStatus;
  readonly repository: GitRepositoryState;
  readonly observations: readonly GameObservation[];
  readonly terminal: readonly TerminalEntry[];
  readonly commandHistory: readonly string[];
  readonly commandsRun: number;
  readonly hintLevel: number;
  readonly hintsUsed: number;
  readonly nextEntryId: number;
}

function createInitialTerminal(mission: MissionDefinition): readonly TerminalEntry[] {
  return [
    {
      id: 1,
      kind: "system",
      content: "TermQuest 虚拟终端已连接。宿主机不会执行你的输入。",
    },
    {
      id: 2,
      kind: "system",
      content: `工作区已挂载：${mission.location} · 分支 main`,
    },
    {
      id: 3,
      kind: "system",
      content: "输入受支持的命令开始调查。可用 ↑ / ↓ 浏览命令历史。",
    },
  ];
}

export function createMissionSession(missionId: MissionId): GameSession {
  const mission = MISSIONS[missionId];
  const terminal = createInitialTerminal(mission);

  return {
    missionId,
    status: "not_started",
    repository: mission.createInitialRepository(),
    observations: [],
    terminal,
    commandHistory: [],
    commandsRun: 0,
    hintLevel: 0,
    hintsUsed: 0,
    nextEntryId: terminal.length + 1,
  };
}

export function submitCommand(session: GameSession, rawInput: string): GameSession {
  const mission = MISSIONS[session.missionId];
  const command = rawInput.trim();
  const allowedCommands =
    session.status === "completed" ? (["git-status"] as const) : mission.commandTypes;
  const result = executeCommand(rawInput, session.repository, {
    allowedCommands,
    unavailableMessage:
      session.status === "completed"
        ? "本关已完成。你仍可运行 git status 检查终端；如需继续练习暂存操作，请重置关卡。"
        : "GIT-01 只需要检查工作区；暂存命令会在 GIT-02 开放。",
  });
  const terminal = [...session.terminal];
  let nextEntryId = session.nextEntryId;

  if (command.length > 0) {
    terminal.push({ id: nextEntryId, kind: "command", content: command });
    nextEntryId += 1;
  }

  if (result.ok) {
    if (result.output.length > 0) {
      terminal.push({ id: nextEntryId, kind: "output", content: result.output });
      nextEntryId += 1;
    }
    if (result.notice) {
      terminal.push({
        id: nextEntryId,
        kind: "system",
        content: `[sandbox] ${result.notice}`,
      });
      nextEntryId += 1;
    }
  } else {
    terminal.push({
      id: nextEntryId,
      kind: "error",
      content: `[${result.error.code}] ${result.error.message}`,
    });
    nextEntryId += 1;
  }

  const observations =
    result.ok && result.observation
      ? [...session.observations, result.observation]
      : session.observations;
  const isComplete = mission.isComplete(result.repository, observations);

  let status = session.status;
  if (isComplete) {
    status = "completed";
  } else if (command.length > 0 && status === "not_started") {
    status = "in_progress";
  }

  return {
    ...session,
    status,
    repository: result.repository,
    observations,
    terminal,
    commandHistory:
      command.length > 0 ? [...session.commandHistory, command] : session.commandHistory,
    commandsRun: session.commandsRun + (command.length > 0 ? 1 : 0),
    nextEntryId,
  };
}

export function revealNextHint(session: GameSession, mission: MissionDefinition): GameSession {
  if (session.hintLevel >= mission.hints.length) {
    return session;
  }

  return {
    ...session,
    hintLevel: session.hintLevel + 1,
    hintsUsed: session.hintsUsed + 1,
  };
}

export function resetSession(session: GameSession): GameSession {
  return createMissionSession(session.missionId);
}
