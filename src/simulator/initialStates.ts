import type { GitRepositoryState } from "./gitRepository";

export function createGitWorkspaceRepository(): GitRepositoryState {
  return {
    branch: "main",
    files: [
      {
        path: "login.py",
        tracked: true,
        workingTreeStatus: "modified",
        indexStatus: "unchanged",
      },
      {
        path: "debug.log",
        tracked: true,
        workingTreeStatus: "modified",
        indexStatus: "unchanged",
      },
      {
        path: "test_output.txt",
        tracked: false,
        workingTreeStatus: "unchanged",
        indexStatus: "unchanged",
      },
    ],
  };
}
