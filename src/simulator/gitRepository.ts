export type GitWorkingTreeStatus = "modified" | "unchanged";
export type GitIndexStatus = "modified" | "added" | "unchanged";

export interface GitFileState {
  readonly path: string;
  readonly tracked: boolean;
  readonly workingTreeStatus: GitWorkingTreeStatus;
  readonly indexStatus: GitIndexStatus;
}

export interface GitRepositoryState {
  readonly branch: string;
  readonly files: readonly GitFileState[];
}

export interface GitStatusSnapshot {
  readonly branch: string;
  readonly staged: readonly string[];
  readonly modified: readonly string[];
  readonly untracked: readonly string[];
}

export interface GitIndexOperationError {
  readonly code: "path_not_found" | "path_not_staged";
  readonly message: string;
}

export type GitIndexOperationResult =
  | {
      readonly ok: true;
      readonly repository: GitRepositoryState;
      readonly changed: boolean;
    }
  | {
      readonly ok: false;
      readonly repository: GitRepositoryState;
      readonly error: GitIndexOperationError;
    };

export function inspectGitStatus(repository: GitRepositoryState): GitStatusSnapshot {
  return {
    branch: repository.branch,
    staged: repository.files
      .filter((file) => file.indexStatus !== "unchanged")
      .map((file) => file.path),
    modified: repository.files
      .filter(
        (file) =>
          file.tracked &&
          file.workingTreeStatus === "modified" &&
          file.indexStatus === "unchanged",
      )
      .map((file) => file.path),
    untracked: repository.files
      .filter((file) => !file.tracked && file.indexStatus === "unchanged")
      .map((file) => file.path),
  };
}

export function formatGitStatus(repository: GitRepositoryState): string {
  const snapshot = inspectGitStatus(repository);
  const lines = [`On branch ${snapshot.branch}`, ""];

  if (snapshot.staged.length > 0) {
    lines.push("Changes to be committed:");
    lines.push('  (use "git restore --staged <file>..." to unstage)');
    lines.push(
      ...repository.files
        .filter((file) => file.indexStatus !== "unchanged")
        .map((file) =>
          file.indexStatus === "added"
            ? `\tnew file:   ${file.path}`
            : `\tmodified:   ${file.path}`,
        ),
      "",
    );
  }

  if (snapshot.modified.length > 0) {
    lines.push("Changes not staged for commit:");
    lines.push('  (use "git add <file>..." to update what will be committed)');
    lines.push('  (use "git restore <file>..." to discard changes in working directory)');
    lines.push(...snapshot.modified.map((file) => `\tmodified:   ${file}`), "");
  }

  if (snapshot.untracked.length > 0) {
    lines.push("Untracked files:");
    lines.push('  (use "git add <file>..." to include in what will be committed)');
    lines.push(...snapshot.untracked.map((file) => `\t${file}`), "");
  }

  if (snapshot.staged.length === 0) {
    lines.push('no changes added to commit (use "git add" to track)');
  }

  return lines.join("\n");
}

function nextIndexStatus(file: GitFileState): GitIndexStatus {
  if (!file.tracked) {
    return file.indexStatus === "unchanged" ? "added" : file.indexStatus;
  }

  return file.workingTreeStatus === "modified" && file.indexStatus === "unchanged"
    ? "modified"
    : file.indexStatus;
}

function replaceFile(
  repository: GitRepositoryState,
  path: string,
  update: (file: GitFileState) => GitFileState,
): GitRepositoryState {
  return {
    ...repository,
    files: repository.files.map((file) => (file.path === path ? update(file) : file)),
  };
}

export function stagePath(
  repository: GitRepositoryState,
  path: string,
): GitIndexOperationResult {
  const file = repository.files.find((candidate) => candidate.path === path);
  if (!file) {
    return {
      ok: false,
      repository,
      error: {
        code: "path_not_found",
        message: `找不到路径：${path}。当前仓库根目录只有 ${repository.files
          .map((candidate) => candidate.path)
          .join("、")}。`,
      },
    };
  }

  const indexStatus = nextIndexStatus(file);
  const changed = indexStatus !== file.indexStatus;

  return {
    ok: true,
    changed,
    repository: changed
      ? replaceFile(repository, path, (current) => ({
          ...current,
          indexStatus,
        }))
      : repository,
  };
}

export function stageAll(repository: GitRepositoryState): GitIndexOperationResult {
  let changed = false;
  const files = repository.files.map((file) => {
    const indexStatus = nextIndexStatus(file);

    if (indexStatus !== file.indexStatus) {
      changed = true;
      return { ...file, indexStatus };
    }

    return file;
  });

  return {
    ok: true,
    changed,
    repository: changed ? { ...repository, files } : repository,
  };
}

export function unstagePath(
  repository: GitRepositoryState,
  path: string,
): GitIndexOperationResult {
  const file = repository.files.find((candidate) => candidate.path === path);
  if (!file) {
    return {
      ok: false,
      repository,
      error: {
        code: "path_not_found",
        message: `找不到路径：${path}。当前仓库根目录只有 ${repository.files
          .map((candidate) => candidate.path)
          .join("、")}。`,
      },
    };
  }

  if (file.indexStatus === "unchanged" && !file.tracked) {
    return {
      ok: false,
      repository,
      error: {
        code: "path_not_staged",
        message: `${path} 尚未被 Git 跟踪，也没有可取消的暂存内容。`,
      },
    };
  }

  return {
    ok: true,
    changed: file.indexStatus !== "unchanged",
    repository:
      file.indexStatus === "unchanged"
        ? repository
        : replaceFile(repository, path, (current) => ({
            ...current,
            indexStatus: "unchanged",
          })),
  };
}
