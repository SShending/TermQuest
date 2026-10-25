import type { GameSession, MissionStatus } from "../game/engine";
import type { MissionDefinition } from "../game/mission";
import { inspectGitStatus } from "../simulator/gitRepository";

interface ProgressPanelProps {
  readonly session: GameSession;
  readonly mission: MissionDefinition;
  readonly onViewDebrief: () => void;
}

const STATUS_TEXT: Record<MissionStatus, string> = {
  not_started: "等待调查",
  in_progress: "调查中",
  completed: "任务完成",
};

export function ProgressPanel({ session, mission, onViewDebrief }: ProgressPanelProps) {
  const snapshot = inspectGitStatus(session.repository);
  const completed = session.status === "completed";

  return (
    <section className={`drawer-section progress-card progress-card--${session.status}`}>
      <div className="drawer-section-heading">
        <span className="drawer-section-kicker">MISSION STATUS</span>
        <span className={`status-pill status-pill--${session.status}`}>
          <span className="status-pill-dot" aria-hidden="true" />
          {STATUS_TEXT[session.status]}
        </span>
      </div>

      <h2>{completed ? "任务目标已达成" : "提交前，先看清现场"}</h2>
      <p className="drawer-section-copy">
        {completed
          ? mission.completion.body
          : "这里显示当前模拟仓库的实时快照。操作后可以随时回来核对结果。"}
      </p>

      <div className="objective-progress">
        <span className="objective-progress-label">目标</span>
        <div className={`objective-check${completed ? " objective-check--done" : ""}`}>
          <span className="check-box" aria-hidden="true">
            {completed ? "✓" : ""}
          </span>
          <span>{mission.objectiveShort}</span>
        </div>
      </div>

      <div className="repo-snapshot" aria-label="模拟仓库快照">
        <div className="snapshot-row">
          <span>分支</span>
          <strong>{snapshot.branch}</strong>
        </div>
        <div className="snapshot-row">
          <span>已暂存</span>
          <strong>{snapshot.staged.length}</strong>
        </div>
        <div className="snapshot-row">
          <span>未暂存修改</span>
          <strong>{snapshot.modified.length}</strong>
        </div>
        <div className="snapshot-row">
          <span>未跟踪文件</span>
          <strong>{snapshot.untracked.length}</strong>
        </div>
      </div>

      <div className="attempt-stats">
        <div>
          <span>命令</span>
          <strong>{session.commandsRun}</strong>
        </div>
        <div>
          <span>提示</span>
          <strong>
            {session.hintsUsed}
            <small>/{mission.hints.length}</small>
          </strong>
        </div>
      </div>

      {completed ? (
        <button className="debrief-link" type="button" onClick={onViewDebrief}>
          查看任务结算 <span aria-hidden="true">↓</span>
        </button>
      ) : (
        <p className="progress-footnote">
          <span aria-hidden="true">⌁</span>{" "}
          {mission.commandTypes.includes("git-add")
            ? "误暂存不会提交任何内容，可用 git restore --staged <文件> 恢复"
            : "状态检查不会修改仓库，试错不会破坏任何内容"}
        </p>
      )}
    </section>
  );
}
