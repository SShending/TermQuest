import { useEffect, useRef, type KeyboardEvent } from "react";
import type { GameSession } from "../game/engine";
import { MISSIONS, type MissionDefinition } from "../game/mission";
import { DebriefPanel } from "./DebriefPanel";
import { HintPanel } from "./HintPanel";
import { MissionBriefing } from "./MissionBriefing";
import { ProgressPanel } from "./ProgressPanel";

export type DrawerTab = "briefing" | "status" | "hints" | "debrief";

interface MissionDrawerProps {
  readonly open: boolean;
  readonly activeTab: DrawerTab;
  readonly session: GameSession;
  readonly mission: MissionDefinition;
  readonly onTabChange: (tab: DrawerTab) => void;
  readonly onClose: () => void;
  readonly onRevealHint: () => void;
  readonly onReset: () => void;
  readonly onNextMission: () => void;
}

const BASE_TABS: readonly DrawerTab[] = ["briefing", "status", "hints"];

const TAB_LABELS: Record<DrawerTab, string> = {
  briefing: "任务",
  status: "状态",
  hints: "提示",
  debrief: "结算",
};

const TAB_TITLES: Record<DrawerTab, string> = {
  briefing: "任务简报",
  status: "任务状态",
  hints: "分层提示",
  debrief: "通关结算",
};

function DrawerDialog({
  activeTab,
  session,
  mission,
  onTabChange,
  onClose,
  onRevealHint,
  onReset,
  onNextMission,
}: Omit<MissionDrawerProps, "open">) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const availableTabs: readonly DrawerTab[] =
    session.status === "completed" ? [...BASE_TABS, "debrief"] : BASE_TABS;
  const currentTab = availableTabs.includes(activeTab) ? activeTab : "briefing";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  function closeDrawer() {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    onClose();
  }

  function resetFromDrawer() {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    onReset();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + availableTabs.length) % availableTabs.length;
    const nextTab = availableTabs[nextIndex];

    if (nextTab) {
      onTabChange(nextTab);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="mission-drawer"
      aria-label={`${mission.title}辅助面板`}
      onCancel={(event) => {
        event.preventDefault();
        closeDrawer();
      }}
    >
      <div className="drawer-layout">
        <div className="drawer-scrim" aria-hidden="true" onClick={closeDrawer} />
        <section className="drawer-surface" aria-labelledby="drawer-title">
          <header className="drawer-header">
            <div className="drawer-header-copy">
              <span className="drawer-kicker">
                {mission.id} · {mission.chapterName}
              </span>
              <h2 id="drawer-title">{TAB_TITLES[currentTab]}</h2>
            </div>
            <button
              className="drawer-close"
              type="button"
              aria-label="关闭辅助面板"
              onClick={closeDrawer}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="drawer-tabs" role="tablist" aria-label="任务辅助内容">
            {availableTabs.map((tab, index) => {
              const selected = currentTab === tab;
              return (
                <button
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  id={`drawer-tab-${tab}`}
                  className={`drawer-tab${selected ? " drawer-tab--active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`drawer-panel-${tab}`}
                  tabIndex={selected ? 0 : -1}
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {TAB_LABELS[tab]}
                  {tab === "hints" ? (
                    <span className="drawer-tab-count">
                      {session.hintsUsed}/{mission.hints.length}
                    </span>
                  ) : null}
                  {tab === "debrief" ? (
                    <span className="drawer-tab-ready" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            className={`drawer-body drawer-body--${currentTab}`}
            id={`drawer-panel-${currentTab}`}
            role="tabpanel"
            aria-labelledby={`drawer-tab-${currentTab}`}
            tabIndex={0}
          >
            {currentTab === "briefing" ? <MissionBriefing mission={mission} /> : null}
            {currentTab === "status" ? (
              <ProgressPanel
                session={session}
                mission={mission}
                onViewDebrief={() => onTabChange("debrief")}
              />
            ) : null}
            {currentTab === "hints" ? (
              <HintPanel
                mission={mission}
                hintLevel={session.hintLevel}
                onReveal={onRevealHint}
              />
            ) : null}
            {currentTab === "debrief" ? (
              <DebriefPanel
                mission={mission}
                nextMission={
                  mission.nextMissionId ? MISSIONS[mission.nextMissionId] : undefined
                }
                commandsRun={session.commandsRun}
                hintsUsed={session.hintsUsed}
                onReset={resetFromDrawer}
                onNextMission={onNextMission}
              />
            ) : null}
          </div>
        </section>
      </div>
    </dialog>
  );
}

export function MissionDrawer({ open, ...props }: MissionDrawerProps) {
  return open ? <DrawerDialog {...props} /> : null;
}
