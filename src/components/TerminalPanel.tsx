import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { GameSession, TerminalEntry } from "../game/engine";
import type { MissionDefinition } from "../game/mission";

interface TerminalPanelProps {
  readonly session: GameSession;
  readonly mission: MissionDefinition;
  readonly onSubmit: (command: string) => void;
  readonly onReset: () => void;
  readonly onViewDebrief: () => void;
}

function outputLineClass(line: string): string {
  if (line.startsWith("On branch")) {
    return "terminal-line terminal-line--branch";
  }
  if (line.endsWith(":")) {
    return "terminal-line terminal-line--section";
  }
  if (line.includes("modified:")) {
    return "terminal-line terminal-line--modified";
  }
  if (line.includes("new file:")) {
    return "terminal-line terminal-line--added";
  }
  if (line.startsWith("\t")) {
    return "terminal-line terminal-line--untracked";
  }
  if (line.startsWith("  (")) {
    return "terminal-line terminal-line--hint";
  }
  return "terminal-line";
}

function OutputBlock({ entry }: { readonly entry: TerminalEntry }) {
  if (entry.kind !== "output") {
    return <pre className="terminal-entry-text">{entry.content}</pre>;
  }

  return (
    <pre className="terminal-entry-text">
      {entry.content.split("\n").map((line, index) => (
        <span className={outputLineClass(line)} key={`${entry.id}-${index}`}>
          {line}
          {"\n"}
        </span>
      ))}
    </pre>
  );
}

export function TerminalPanel({
  session,
  mission,
  onSubmit,
  onReset,
  onViewDebrief,
}: TerminalPanelProps) {
  const [input, setInput] = useState("");
  const [historyOffset, setHistoryOffset] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const output = outputRef.current;
    if (output) {
      output.scrollTop = output.scrollHeight;
    }
  }, [session.terminal.length]);

  useEffect(() => {
    const output = outputRef.current;
    if (!output) {
      return;
    }

    const keepPromptVisible = () => {
      output.scrollTop = output.scrollHeight;
    };
    const visualViewport = window.visualViewport;

    window.addEventListener("resize", keepPromptVisible);
    visualViewport?.addEventListener("resize", keepPromptVisible);

    return () => {
      window.removeEventListener("resize", keepPromptVisible);
      visualViewport?.removeEventListener("resize", keepPromptVisible);
    };
  }, []);

  function runCommand() {
    onSubmit(input);
    setInput("");
    setHistoryOffset(0);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runCommand();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }

    const history = session.commandHistory;
    if (history.length === 0) {
      return;
    }

    event.preventDefault();
    if (event.key === "ArrowUp") {
      const nextOffset = Math.min(historyOffset + 1, history.length);
      setHistoryOffset(nextOffset);
      setInput(history[history.length - nextOffset] ?? "");
      return;
    }

    const nextOffset = Math.max(historyOffset - 1, 0);
    setHistoryOffset(nextOffset);
    setInput(nextOffset === 0 ? "" : (history[history.length - nextOffset] ?? ""));
  }

  return (
    <section
      className={`terminal-card${session.status === "completed" ? " terminal-card--complete" : ""}`}
      aria-labelledby="terminal-title"
    >
      <header className="terminal-header">
        <div className="terminal-title" id="terminal-title">
          <span className="terminal-title-mark" aria-hidden="true">
            ›_
          </span>
          player@termquest: {mission.location}
        </div>
        <span className="terminal-mode">受控沙箱</span>
      </header>

      <div className="terminal-context">
        <span className="sandbox-badge">
          <span className="sandbox-dot" aria-hidden="true" /> SAFE MODE
        </span>
        <span>输入不会被宿主机执行</span>
      </div>

      <div className="terminal-output" ref={outputRef}>
        <div className="terminal-history" role="log" aria-live="polite">
          {session.terminal.map((entry) => (
            <div className={`terminal-entry terminal-entry--${entry.kind}`} key={entry.id}>
              {entry.kind === "command" ? (
                <div className="terminal-command-line">
                  <span className="terminal-prompt-user">player@termquest</span>
                  <span className="terminal-prompt-colon">:</span>
                  <span className="terminal-prompt-path">{mission.location}</span>
                  <span className="terminal-prompt-symbol">$</span>
                  <span className="terminal-command-text">{entry.content}</span>
                </div>
              ) : (
                <OutputBlock entry={entry} />
              )}
            </div>
          ))}
        </div>

        {session.status === "completed" ? (
          <div className="terminal-completion-banner" role="status">
            <span className="completion-mark" aria-hidden="true">
              ✓
            </span>
            <div className="completion-copy">
              <strong>{mission.completion.title}</strong>
              <span>{mission.completion.body}</span>
            </div>
            <button className="completion-link" type="button" onClick={onViewDebrief}>
              查看结算 <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}

        <form className="command-bar" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="command-input">
            输入虚拟终端命令
          </label>
          <div className="command-prompt" aria-hidden="true">
            <span className="command-prompt-user">player@termquest</span>
            <span className="command-prompt-colon">:</span>
            <span className="command-prompt-path">{mission.location}</span>
            <span className="command-prompt-symbol">$</span>
          </div>
          <input
            ref={inputRef}
            id="command-input"
            className="command-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setHistoryOffset(0);
            }}
            onKeyDown={handleInputKeyDown}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
          />
          {input.trim().length > 0 ? (
            <button className="submit-button" type="submit" aria-label="运行命令" title="运行命令">
              <span aria-hidden="true">↵</span>
            </button>
          ) : null}
        </form>
      </div>

      <footer className="terminal-footer">
        <span className="safe-mode">
          <span className="safe-mode-dot" aria-hidden="true" /> SAFE MODE
        </span>
        <span className="terminal-footer-copy">仅允许明确支持的命令</span>
        <button className="reset-button" type="button" onClick={onReset}>
          <span aria-hidden="true">↺</span> 重置关卡
        </button>
      </footer>
    </section>
  );
}
