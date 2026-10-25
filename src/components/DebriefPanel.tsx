import type { MissionDefinition } from "../game/mission";

interface DebriefPanelProps {
  readonly mission: MissionDefinition;
  readonly nextMission?: MissionDefinition;
  readonly commandsRun: number;
  readonly hintsUsed: number;
  readonly onReset: () => void;
  readonly onNextMission: () => void;
}

export function DebriefPanel({
  mission,
  nextMission,
  commandsRun,
  hintsUsed,
  onReset,
  onNextMission,
}: DebriefPanelProps) {
  const { debrief } = mission;

  return (
    <section className="debrief-panel" aria-labelledby="debrief-title">
      <div className="debrief-hero">
        <span className="debrief-emblem" aria-hidden="true">
          <span>✓</span>
        </span>
        <div className="debrief-heading">
          <span className="debrief-kicker">MISSION CLEAR · {mission.id}</span>
          <h2 id="debrief-title">{debrief.headline}</h2>
          <p>{debrief.summary}</p>
        </div>
        <div className="debrief-stats">
          <div>
            <span>执行命令</span>
            <strong>{commandsRun}</strong>
          </div>
          <div>
            <span>使用提示</span>
            <strong>{hintsUsed}</strong>
          </div>
          <div>
            <span>任务状态</span>
            <strong className="debrief-stat-success">完成</strong>
          </div>
        </div>
      </div>

      <div className="concept-grid">
        {debrief.concepts.map((concept, index) => (
          <article className="concept-card" key={concept.term}>
            <span className="concept-number">{String(index + 1).padStart(2, "0")}</span>
            <h3>{concept.term}</h3>
            <p>{concept.detail}</p>
          </article>
        ))}
      </div>

      <div className="debrief-details">
        <div className="debrief-insight">
          <span className="detail-label">一眼区分</span>
          <p>{debrief.distinction}</p>
        </div>
        <div className="debrief-insight debrief-insight--accent">
          <span className="detail-label">真实工作流</span>
          <p>{debrief.realWorld}</p>
        </div>
      </div>

      <div className="debrief-footer">
        <blockquote>
          <span aria-hidden="true">“</span>
          {debrief.takeaway}
        </blockquote>
        <div className="debrief-actions">
          <span>
            {nextMission
              ? "修复已经就位。下一步，把它准确地放进下一次提交。"
              : "终端仍可继续检查。准备好后，可以重新体验。"}
          </span>
          <div className="debrief-action-buttons">
            {nextMission ? (
              <button className="next-mission-button" type="button" onClick={onNextMission}>
                进入 {nextMission.id} <span aria-hidden="true">→</span>
              </button>
            ) : null}
            <button className="replay-button" type="button" onClick={onReset}>
              <span aria-hidden="true">↺</span> 重新挑战
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
