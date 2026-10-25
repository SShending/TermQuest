import {
  formatGitStatus,
  inspectGitStatus,
  stageAll,
  stagePath,
  unstagePath,
  type GitRepositoryState,
  type GitStatusSnapshot,
} from "../simulator/gitRepository";
import { parseCommand, type CommandError, type CommandType } from "./parser";

export interface GitStatusObservation {
  readonly kind: "git_status";
  readonly snapshot: GitStatusSnapshot;
}

export type GameObservation = GitStatusObservation;

export type ExecutionErrorCode =
  | CommandError["code"]
  | "path_not_found"
  | "path_not_staged"
  | "command_not_available";

export interface ExecutionError {
  readonly code: ExecutionErrorCode;
  readonly message: string;
}

export interface CommandAccess {
  readonly allowedCommands: readonly CommandType[];
  readonly unavailableMessage?: string;
}

export type CommandExecution =
  | {
      readonly ok: true;
      readonly output: string;
      readonly observation?: GameObservation;
      readonly notice?: string;
      readonly repository: GitRepositoryState;
    }
  | {
      readonly ok: false;
      readonly error: ExecutionError;
      readonly repository: GitRepositoryState;
    };

export function executeCommand(
  input: string,
  repository: GitRepositoryState,
  access: CommandAccess,
): CommandExecution {
  const parsed = parseCommand(input);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error, repository };
  }

  if (!access.allowedCommands.includes(parsed.command.type)) {
    return {
      ok: false,
      repository,
      error: {
        code: "command_not_available",
        message:
          access.unavailableMessage ??
          `本关当前不开放 ${parsed.command.type}。请使用任务中列出的受支持命令。`,
      },
    };
  }

  switch (parsed.command.type) {
    case "git-status": {
      const snapshot = inspectGitStatus(repository);
      return {
        ok: true,
        output: formatGitStatus(repository),
        observation: { kind: "git_status", snapshot },
        repository,
      };
    }

    case "git-add": {
      const path = parsed.command.path;
      const result =
        path === null ? stageAll(repository) : stagePath(repository, path);

      if (!result.ok) {
        return { ok: false, error: result.error, repository: result.repository };
      }

      return {
        ok: true,
        output: "",
        repository: result.repository,
        notice:
          path === null
            ? result.changed
              ? "已暂存工作区中的全部改动。运行 git status 检查暂存内容。"
              : "工作区目前没有可暂存的新变化。运行 git status 查看当前状态。"
            : result.changed
              ? `已暂存 ${path}。运行 git status 检查暂存内容。`
              : `${path} 没有可暂存的新变化。运行 git status 查看当前状态。`,
      };
    }

    case "git-restore-staged": {
      const result = unstagePath(repository, parsed.command.path);
      if (!result.ok) {
        return { ok: false, error: result.error, repository: result.repository };
      }

      return {
        ok: true,
        output: "",
        repository: result.repository,
        notice: result.changed
          ? `已从暂存区移除 ${parsed.command.path}。运行 git status 确认结果。`
          : `${parsed.command.path} 当前没有已暂存的改动。`,
      };
    }
  }
}
