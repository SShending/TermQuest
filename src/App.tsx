import { useState } from "react";
import { MissionDrawer, type DrawerTab } from "./components/MissionDrawer";
import { TerminalPanel } from "./components/TerminalPanel";
import {
  createMissionSession,
  resetSession,
  revealNextHint,
  submitCommand,
  type MissionStatus,
} from "./game/engine";
import { MISSIONS } from "./game/mission";

const STATUS_TEXT: Record<MissionStatus, string> = {
  not_started: "等待调查",
  in_progress: "调查中",
  completed: "任务完成",
};

export default function App() {
  const [session, setSession] = useState(() => createMissionSession("GIT-01"));
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DrawerTab>("briefing");
  const mission = MISSIONS[session.missionId];

  function handleSubmit(command: string) {
    setSession((current) => submitCommand(current, command));
  }

  function handleReset() {
    setSession((current) => resetSession(current));
    setActiveTab("briefing");
    setDrawerOpen(false);
  }

  function handleRevealHint() {
    setSession((current) => revealNextHint(current, MISSIONS[current.missionId]));
  }

  function handleNextMission() {
    if (!mission.nextMissionId) {
      return;
    }

    setSession(createMissionSession(mission.nextMissionId));
    setActiveTab("briefing");
    setDrawerOpen(true);
  }

  function openDrawer(tab: DrawerTab) {
    setActiveTab(tab);
    setDrawerOpen(true);
  }

  return (
    <div className="app-shell">
      <header className="game-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 44 44" role="presentation">
              <path d="M10 12.5 21.8 6 34 12.5v18L22 37 10 30.5z" />
              <path d="m15 16 6 5-6 5M23.5 26H29" />
            </svg>
          </span>
          <div className="brand-copy">
            <span className="brand-name">
              TERM<span>QUEST</span>
            </span>
            <span className="brand-tagline">LEARN BY DOING · ONE COMMAND AT A TIME</span>
          </div>
        </div>

        <div className="header-mission">
          <span className="header-meta">
            CHAPTER {String(mission.chapterNumber).padStart(2, "0")} ·{" "}
            {mission.chapterName.toUpperCase()}
          </span>
          <h1>{mission.title}</h1>
        </div>

        <div className="header-actions">
          <span className="header-mission-id">
            M{String(mission.number).padStart(2, "0")} /{" "}
            {String(mission.total).padStart(2, "0")}
          </span>
          <div className={`header-status header-status--${session.status}`}>
            <span className="header-status-dot" aria-hidden="true" />
            <span>{STATUS_TEXT[session.status]}</span>
          </div>
        </div>
      </header>

      <main className="terminal-stage" aria-label={`${mission.id} 虚拟终端游戏`}>
        <div className="mission-strip">
          <span className="mission-strip-code">{mission.id}</span>
          <p className="mission-strip-objective">
            <span>目标</span>
            {mission.objective}
          </p>
        </div>

        <TerminalPanel
          session={session}
          mission={mission}
          onSubmit={handleSubmit}
          onReset={handleReset}
          onViewDebrief={() => openDrawer("debrief")}
        />
      </main>

      <nav className="mission-dock" aria-label="任务辅助入口">
        <button
          className="dock-button"
          type="button"
          aria-label="打开任务简报"
          aria-haspopup="dialog"
          onClick={() => openDrawer("briefing")}
        >
          <span className="dock-icon" aria-hidden="true">
            ▤
          </span>
          <span>任务</span>
        </button>
        <button
          className="dock-button"
          type="button"
          aria-label="打开任务状态"
          aria-haspopup="dialog"
          onClick={() => openDrawer("status")}
        >
          <span className="dock-icon" aria-hidden="true">
            ◈
          </span>
          <span>状态</span>
        </button>
        <button
          className="dock-button"
          type="button"
          aria-label="打开提示面板"
          aria-haspopup="dialog"
          onClick={() => openDrawer("hints")}
        >
          <span className="dock-icon dock-icon--question" aria-hidden="true">
            ?
          </span>
          <span>提示</span>
          <span className="dock-count">
            {session.hintsUsed}/{mission.hints.length}
          </span>
        </button>
        {session.status === "completed" ? (
          <button
            className="dock-button dock-button--complete"
            type="button"
            aria-label="打开通关结算"
            aria-haspopup="dialog"
            onClick={() => openDrawer("debrief")}
          >
            <span className="dock-icon" aria-hidden="true">
              ✓
            </span>
            <span>结算</span>
          </button>
        ) : null}
      </nav>

      <MissionDrawer
        open={drawerOpen}
        activeTab={activeTab}
        session={session}
        mission={mission}
        onTabChange={setActiveTab}
        onClose={() => setDrawerOpen(false)}
        onRevealHint={handleRevealHint}
        onReset={handleReset}
        onNextMission={handleNextMission}
      />
    </div>
  );
}
