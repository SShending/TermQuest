import type { GitRepositoryState } from "../simulator/gitRepository";
import { createGitWorkspaceRepository } from "../simulator/initialStates";
import type { GameObservation } from "../terminal/execute";
import type { CommandType } from "../terminal/parser";

export type MissionId = "GIT-01" | "GIT-02";

export interface MissionHint {
  readonly title: string;
  readonly body: string;
  readonly example?: string;
}

export interface DebriefConcept {
  readonly term: string;
  readonly detail: string;
}

export interface MissionDebrief {
  readonly headline: string;
  readonly summary: string;
  readonly concepts: readonly DebriefConcept[];
  readonly distinction: string;
  readonly realWorld: string;
  readonly takeaway: string;
}

export interface MissionDefinition {
  readonly id: MissionId;
  readonly number: number;
  readonly total: number;
  readonly chapterNumber: number;
  readonly chapterLabel: string;
  readonly chapterName: string;
  readonly title: string;
  readonly titleEn: string;
  readonly location: string;
  readonly sender: string;
  readonly story: readonly string[];
  readonly objective: string;
  readonly objectiveShort: string;
  readonly commandTypes: readonly CommandType[];
  readonly completion: {
    readonly title: string;
    readonly body: string;
  };
  readonly nextMissionId?: MissionId;
  readonly createInitialRepository: () => GitRepositoryState;
  readonly hints: readonly MissionHint[];
  readonly debrief: MissionDebrief;
  readonly isComplete: (
    repository: GitRepositoryState,
    observations: readonly GameObservation[],
  ) => boolean;
}

function includesEvery(values: readonly string[], expected: readonly string[]): boolean {
  return expected.every((value) => values.includes(value));
}

export const GIT_01: MissionDefinition = {
  id: "GIT-01",
  number: 1,
  total: 10,
  chapterNumber: 1,
  chapterLabel: "第一章",
  chapterName: "代码救援",
  title: "可疑的工作区",
  titleEn: "The Suspicious Workspace",
  location: "~/project",
  sender: "队友 Mika",
  story: [
    "Mika 把登录验证的修复留在了工作区。她留言说“应该改好了”，但 debug.log 还在，test_output.txt 也像是刚才调试留下的。",
    "在暂存或提交任何内容之前，你得先确认仓库里究竟发生了什么。别让临时文件混进登录修复。",
  ],
  objective: "检查 ~/project 当前的 Git 状态，确认分支、未暂存修改和未跟踪文件。",
  objectiveShort: "检查工作区状态与未跟踪文件",
  commandTypes: ["git-status"],
  completion: {
    title: "GIT-01 已通过",
    body: "工作区状态已确认，可以查看本次任务讲解。",
  },
  nextMissionId: "GIT-02",
  createInitialRepository: createGitWorkspaceRepository,
  hints: [
    {
      title: "观察方向",
      body: "先别急着提交。你需要一个总览，能同时说明当前分支、已跟踪文件的修改，以及哪些文件还没有被 Git 跟踪。",
    },
    {
      title: "命令用途",
      body: "Git 提供了一个只读命令，用来查看工作区和暂存区的当前状态。它不会提交、暂存或修改任何文件。",
    },
    {
      title: "具体示例",
      body: "在终端输入下面的命令并按 Enter。重点观察 On branch、Changes not staged for commit 和 Untracked files。",
      example: "git status",
    },
  ],
  debrief: {
    headline: "你已经看清了工作区",
    summary:
      "git status 像一张提交前的现场地图：它告诉你身处哪个分支、哪些修改还没暂存，以及哪些文件尚未进入 Git 的视野。",
    concepts: [
      {
        term: "当前分支 · main",
        detail:
          "分支是一条独立的开发路线。On branch main 表示接下来的提交会记录在 main 这条线上。",
      },
      {
        term: "已跟踪文件",
        detail:
          "login.py 和 debug.log 已被 Git 跟踪。跟踪不等于已暂存；它只表示 Git 已经在关注这些文件的变化。",
      },
      {
        term: "未暂存修改",
        detail:
          "Changes not staged for commit 表示改动仍只存在于工作区。本次的两个文件是 login.py 和 debug.log。",
      },
      {
        term: "未跟踪文件",
        detail:
          "test_output.txt 从未被 Git 记录。除非被明确加入暂存区，否则常规提交不会包含它。",
      },
      {
        term: "工作区与暂存区",
        detail:
          "工作区是你正在编辑的文件；暂存区是下一次提交的预备清单。git status 底部的 no changes added to commit 说明暂存区目前是空的。",
      },
      {
        term: "先检查，再提交",
        detail:
          "提交前先检查状态，能避免把调试输出、临时文件和无关改动误装进同一次提交。",
      },
    ],
    distinction:
      "工作区 = 文件当前的样子；暂存区 = 你准备放进下一次提交的内容。两者并不自动同步。",
    realWorld:
      "真实工作流中，准备提交登录修复时，你可以先运行 git status，发现 debug.log 和 test_output.txt；随后只暂存 login.py 并提交。这样评审者看到的是一次聚焦的修复，而不是一堆调试残留。",
    takeaway: "看清状态，再决定把什么放进下一次提交。",
  },
  isComplete: (_repository, observations) =>
    observations.some(
      (observation) =>
        observation.kind === "git_status" &&
        observation.snapshot.branch === "main" &&
        observation.snapshot.staged.length === 0 &&
        includesEvery(observation.snapshot.modified, ["login.py", "debug.log"]) &&
        includesEvery(observation.snapshot.untracked, ["test_output.txt"]),
    ),
};

export const GIT_02: MissionDefinition = {
  id: "GIT-02",
  number: 2,
  total: 10,
  chapterNumber: 1,
  chapterLabel: "第一章",
  chapterName: "代码救援",
  title: "只暂存修复",
  titleEn: "Stage Only the Fix",
  location: "~/project",
  sender: "队友 Mika",
  story: [
    "登录修复已经改好，Mika 让你先把它放进下一次提交。可 debug.log 里还留着刚才的调试输出，test_output.txt 也不该跟着走。",
    "不要把所有改动一起暂存。先确认工作区，再把 login.py 单独加入暂存区；下一次提交的预备清单里应当只有登录修复。",
  ],
  objective: "只把 login.py 加入暂存区，保持 debug.log 和 test_output.txt 不进入本次提交。",
  objectiveShort: "仅将 login.py 加入暂存区",
  commandTypes: ["git-status", "git-add", "git-restore-staged"],
  completion: {
    title: "GIT-02 已通过",
    body: "暂存区里只有 login.py，调试文件不会跟着进入下一次提交。",
  },
  createInitialRepository: createGitWorkspaceRepository,
  hints: [
    {
      title: "观察暂存区",
      body: "先运行 git status。确认 login.py 和 debug.log 仍在 Changes not staged for commit，而 test_output.txt 还是 Untracked files。",
    },
    {
      title: "命令用途",
      body: "git add 会把一个文件当前的内容放进暂存区。这里要给出明确文件名，而不是用 git add . 把所有改动一起收进去。",
    },
    {
      title: "具体示例",
      body: "只暂存登录修复，然后再次查看状态。若暂时选错文件，可以用 git restore --staged <文件> 把它移出暂存区。",
      example: "git add login.py",
    },
  ],
  debrief: {
    headline: "下一次提交已经聚焦",
    summary:
      "你没有把整个工作区一把塞进提交，而是只把 login.py 的修复加入暂存区。暂存区因此成为一份清晰、可审查的提交预览。",
    concepts: [
      {
        term: "暂存区 · index",
        detail:
          "暂存区记录下一次提交准备包含的版本。git add login.py 把工作区里的当前内容复制到这份预备清单中。",
      },
      {
        term: "定向暂存",
        detail:
          "给出明确路径能避免无关改动混入提交。当前仓库里，debug.log 仍未暂存，test_output.txt 仍然没有被 Git 跟踪。",
      },
      {
        term: "未跟踪文件如何进入暂存区",
        detail:
          "git add test_output.txt 会让它出现在 Changes to be committed，并标记为 new file。但本次任务不应把它加入。",
      },
      {
        term: "撤销暂存",
        detail:
          "git restore --staged <文件> 只把该文件移出暂存区，不会删除工作区里的修改。误暂存后仍可恢复并重新选择。",
      },
      {
        term: "用状态验证结果",
        detail:
          "操作完成后再次运行 git status，Changes to be committed 应当只列出 login.py；另外两个文件不应出现在暂存区。",
      },
      {
        term: "提交的是暂存快照",
        detail:
          "下一次提交只会记录暂存区里准备的内容，而不是工作区中的全部文件。这正是定向暂存能保持提交聚焦的原因。",
      },
    ],
    distinction:
      "工作区 = 文件当前的样子；暂存区 = 下一次提交的预备快照。git add 是在两者之间主动挑选内容。",
    realWorld:
      "提交登录修复时，工作区常会同时出现调试日志和临时输出。只暂存 login.py、运行 git status 复核，再提交，评审者看到的就只会是与登录验证有关的改动。",
    takeaway: "不要提交整个混乱的工作区，只暂存这次真正需要的那部分。",
  },
  isComplete: (repository) => {
    const login = repository.files.find((file) => file.path === "login.py");
    const debug = repository.files.find((file) => file.path === "debug.log");
    const testOutput = repository.files.find((file) => file.path === "test_output.txt");

    return (
      login?.indexStatus === "modified" &&
      debug?.indexStatus === "unchanged" &&
      testOutput?.indexStatus === "unchanged"
    );
  },
};

export const MISSIONS: Record<MissionId, MissionDefinition> = {
  "GIT-01": GIT_01,
  "GIT-02": GIT_02,
};
