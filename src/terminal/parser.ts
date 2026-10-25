export interface GitStatusCommand {
  readonly type: "git-status";
}

export interface GitAddCommand {
  readonly type: "git-add";
  readonly path: string | null;
}

export interface GitRestoreStagedCommand {
  readonly type: "git-restore-staged";
  readonly path: string;
}

export type ParsedCommand = GitStatusCommand | GitAddCommand | GitRestoreStagedCommand;
export type CommandType = ParsedCommand["type"];

export type CommandErrorCode =
  | "empty_input"
  | "unsupported_syntax"
  | "unsupported_command"
  | "unsupported_arguments"
  | "invalid_path";

export interface CommandError {
  readonly code: CommandErrorCode;
  readonly message: string;
}

export type ParseResult =
  | { readonly ok: true; readonly command: ParsedCommand }
  | { readonly ok: false; readonly error: CommandError };

const SHELL_SYNTAX = /[;&|<>`$(){}\[\]\\*?"'!]/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const ROOT_FILE_NAME = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
const SUPPORTED_COMMAND_HINT = "当前关卡只开放任务中列出的受控 Git 命令。";

function failure(code: CommandErrorCode, message: string): ParseResult {
  return { ok: false, error: { code, message } };
}

type PathValidation =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly error: CommandError };

function validateRootPath(path: string | undefined): PathValidation {
  if (path === undefined) {
    return {
      ok: false,
      error: {
        code: "unsupported_arguments",
        message: "缺少文件路径。请一次只指定一个仓库根目录下的文件名。",
      },
    };
  }

  if (path.startsWith("-")) {
    return {
      ok: false,
      error: {
        code: "unsupported_arguments",
        message: `不支持参数：${path}。请直接指定要操作的文件名。`,
      },
    };
  }

  if (
    path.includes("/") ||
    path.includes("\\") ||
    path === ".." ||
    !ROOT_FILE_NAME.test(path)
  ) {
    return {
      ok: false,
      error: {
        code: "invalid_path",
        message: `不支持的路径：${path}。本关只接受仓库根目录下的单个文件名，例如 login.py。`,
      },
    };
  }

  return { ok: true, path };
}

export function parseCommand(input: string): ParseResult {
  if (input.trim().length === 0) {
    return failure("empty_input", "没有输入命令。输入 git status 查看当前仓库状态。");
  }

  if (CONTROL_CHARACTERS.test(input)) {
    return failure("unsupported_syntax", "一次只能运行一行命令，控制字符不受支持。");
  }

  if (SHELL_SYNTAX.test(input)) {
    return failure(
      "unsupported_syntax",
      "虚拟终端不支持管道、重定向、命令拼接、命令替换或通配符。请一次只输入一个受支持的命令。",
    );
  }

  const tokens = input.trim().split(/\s+/);
  const program = tokens[0];
  const separator = tokens[1];
  const extraTokens = tokens.slice(2);

  if (program !== "git") {
    return failure(
      "unsupported_command",
      `不支持的命令：${program ?? input.trim()}。${SUPPORTED_COMMAND_HINT}`,
    );
  }

  if (separator === undefined) {
    return failure("unsupported_command", `缺少 Git 子命令。${SUPPORTED_COMMAND_HINT}`);
  }

  switch (separator) {
    case "status": {
      if (extraTokens.length > 0) {
        return failure(
          "unsupported_arguments",
          `git status 不接受参数。检测到额外参数：${extraTokens.join(" ")}。`,
        );
      }

      return { ok: true, command: { type: "git-status" } };
    }

    case "add": {
      if (extraTokens.length === 0) {
        return failure(
          "unsupported_arguments",
          "git add 需要且只接受一个文件路径，或使用 git add .。",
        );
      }

      if (extraTokens.length > 1) {
        return failure(
          "unsupported_arguments",
          "一次只能暂存一个明确路径。多个文件请分别执行 git add <文件>。",
        );
      }

      const path = extraTokens[0];
      if (path === ".") {
        return { ok: true, command: { type: "git-add", path: null } };
      }

      const pathResult = validateRootPath(path);
      if (!pathResult.ok) {
        return pathResult;
      }

      return { ok: true, command: { type: "git-add", path: pathResult.path } };
    }

    case "restore": {
      if (extraTokens[0] !== "--staged") {
        return failure(
          "unsupported_arguments",
          "本关只支持 git restore --staged <文件>，用于取消暂存。",
        );
      }

      if (extraTokens.length > 2) {
        return failure(
          "unsupported_arguments",
          "一次只能取消一个文件的暂存。多个文件请分别执行 git restore --staged <文件>。",
        );
      }

      const pathResult = validateRootPath(extraTokens[1]);
      if (!pathResult.ok) {
        return pathResult;
      }

      return {
        ok: true,
        command: { type: "git-restore-staged", path: pathResult.path },
      };
    }

    default:
      return failure(
        "unsupported_command",
        `不支持的 Git 子命令：${separator}。${SUPPORTED_COMMAND_HINT}`,
      );
  }
}
