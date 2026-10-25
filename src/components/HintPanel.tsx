import type { MissionDefinition } from "../game/mission";

interface HintPanelProps {
  readonly mission: MissionDefinition;
  readonly hintLevel: number;
  readonly onReveal: () => void;
}

export function HintPanel({ mission, hintLevel, onReveal }: HintPanelProps) {
  const revealedHints = mission.hints.slice(0, hintLevel);
  const hintsExhausted = hintLevel >= mission.hints.length;

  return (
    <section className="drawer-section hint-card" aria-labelledby="hint-title">
      <div className="drawer-section-heading">
        <span className="drawer-section-kicker">FIELD NOTES</span>
        <span className="hint-counter">
          {hintLevel}/{mission.hints.length}
        </span>
      </div>
      <h2 id="hint-title">需要一点线索？</h2>
      <p className="drawer-section-copy">提示按层展开。先观察，再看命令用途，最后才揭示示例。</p>

      {revealedHints.length === 0 ? (
        <div className="hint-empty">
          <span className="hint-empty-mark" aria-hidden="true">
            ?
          </span>
          <p>卡住了再从第一层开始。提示不会替你标记任务完成。</p>
        </div>
      ) : (
        <ol className="hint-list">
          {revealedHints.map((hint, index) => (
            <li className="hint-item" key={hint.title}>
              <span className="hint-level">HINT 0{index + 1}</span>
              <strong>{hint.title}</strong>
              <p>{hint.body}</p>
              {hint.example ? (
                <code className="hint-example">
                  <span aria-hidden="true">$</span> {hint.example}
                </code>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <button
        className="hint-button"
        type="button"
        onClick={onReveal}
        disabled={hintsExhausted}
      >
        {hintsExhausted
          ? "提示已全部解锁"
          : hintLevel === 0
            ? "获取第一层提示"
            : "展开下一层提示"}
        {!hintsExhausted ? <span aria-hidden="true">→</span> : null}
      </button>
    </section>
  );
}
