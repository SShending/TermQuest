import type { MissionDefinition } from "../game/mission";

interface MissionBriefingProps {
  readonly mission: MissionDefinition;
}

export function MissionBriefing({ mission }: MissionBriefingProps) {
  return (
    <article className="briefing-card" aria-labelledby="mission-title">
      <div className="briefing-rail" aria-hidden="true" />
      <div className="briefing-topline">
        <span className="signal-label">
          <span className="signal-dot" aria-hidden="true" />
          INCOMING TRANSMISSION
        </span>
        <span className="mission-code">{mission.id}</span>
      </div>

      <div className="briefing-heading">
        <p className="briefing-sender">
          <span className="sender-avatar" aria-hidden="true">
            M
          </span>
          {mission.sender} · 开发小组
        </p>
        <h2 id="mission-title">{mission.title}</h2>
        <p className="mission-title-en">{mission.titleEn}</p>
      </div>

      <div className="story-copy">
        {mission.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="objective-box">
        <span className="objective-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation">
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </span>
        <div>
          <span className="objective-label">任务目标</span>
          <p>{mission.objective}</p>
        </div>
      </div>

      <div className="briefing-meta">
        <span className="meta-chip">
          <span className="meta-prompt" aria-hidden="true">
            $
          </span>
          {mission.location}
        </span>
        <span className="meta-chip">
          <span className="shield-glyph" aria-hidden="true">
            ◇
          </span>
          受控虚拟环境
        </span>
        <span className="meta-chip meta-chip--quiet">
          {mission.commandTypes.includes("git-add") ? "暂存操作练习" : "只读侦察任务"}
        </span>
      </div>
    </article>
  );
}
