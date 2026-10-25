# Architecture

## 1. Design goal

Build a deterministic, testable H5 game whose virtual terminal feels useful for learning real Git and Linux workflows without executing commands on the host system.

Keep UI, command interpretation, simulated environment state, mission rules, and persistence separate. The mission engine must be testable without a browser.

## 2. Initial stack

- TypeScript
- React
- Vite
- Vitest for unit tests
- A lightweight CSS approach; avoid introducing a large UI framework until needed

This is a practical default for the independent H5 prototype. Platform-specific integration must remain behind an adapter boundary.

## 3. Suggested source layout

```text
src/
  app/
    App.tsx
    routes.ts
  components/
    MissionBriefing.tsx
    TerminalPanel.tsx
    CommandInput.tsx
    HintPanel.tsx
    DebriefPanel.tsx
    ProgressView.tsx
  game/
    types.ts
    engine.ts
    missionRegistry.ts
    missions/
      git/
      linux/
  terminal/
    lexer.ts
    parser.ts
    commands/
      git.ts
      filesystem.ts
      text.ts
      permissions.ts
    execute.ts
    output.ts
  simulator/
    filesystem.ts
    gitRepository.ts
    initialStates.ts
  persistence/
    ProgressStore.ts
    LocalStorageProgressStore.ts
  styles/
  main.tsx
tests/
  terminal/
  game/
  missions/
```

Treat this as a suggested structure, not a reason to create empty files prematurely. Add modules when they have a concrete responsibility.

## 4. Runtime flow

1. The player submits a command string.
2. The lexer/parser converts the input into a small internal command representation.
3. Validation rejects unsupported syntax and commands before any state mutation.
4. The simulator applies an allowlisted operation to the virtual environment.
5. The terminal renders stdout/stderr-like output and the updated environment.
6. The mission engine evaluates completion predicates against the resulting state.
7. The UI updates mission status and, when complete, displays the debrief.
8. Progress is persisted through an abstract progress-store interface.

The command engine and simulator must be pure or explicitly state-driven where practical, so tests can provide a known state and assert the exact next state and output.

## 5. Virtual environment model

### Virtual filesystem

Minimum fields:
- Canonical path.
- Entry type: directory or file.
- File contents for text files used in missions.
- Permission bits or a simplified mode representation.
- Parent/child relationships or a deterministic path index.

The filesystem must define behavior for missing paths, directories used as files, and unsupported operations.

### Simulated Git repository

Minimum fields:
- Current branch.
- Branch-to-commit references.
- Commit records with IDs, parent references, messages, and tracked snapshots or equivalent simplified change records.
- Working-tree changes.
- Staging/index contents.
- Untracked files.
- Enough ancestry information to model the MVP branch and merge missions.

Do not implement all Git internals. Implement only the semantics needed by the supported missions and tests, and document any simplification that could affect learning.

## 6. Supported command grammar

The terminal is not a general-purpose shell. Define a documented allowlist and reject everything else.

Initial candidates:
- Git: `git status`, `git add <path>`, `git commit -m <message>`, `git switch <branch>`, `git switch -c <branch>`, `git merge <branch>`.
- Navigation and files: `pwd`, `ls`, `ls -l`, `cd <path>`, `find <path> -name <name>`.
- Text and pipes: `grep <pattern> <file>`, `wc -l`, a single supported pipe between compatible commands.
- Permissions: `chmod +x <path>`.

The exact accepted quoting, flags, and argument forms must be specified in tests and help text. Expand the allowlist only when a mission needs it.

### Safety requirements

- Never use `eval`, `exec`, `child_process`, shell subprocesses, or equivalent host execution mechanisms for player input.
- Never pass command text to a backend shell.
- Never read or write arbitrary host files as a consequence of a game command.
- Parse only the supported grammar. Reject command substitution, redirection, chaining, globbing, and unsupported pipes unless explicitly implemented in the virtual environment.
- A rejected command must not mutate the virtual environment.
- Avoid implying that a simulated command was executed on the player's real machine.

## 7. Mission model

Each mission definition should contain:
- Stable mission ID and chapter ID.
- Title, narrative briefing, and objective.
- Deterministic initial-state factory.
- Allowed commands or command capabilities.
- Completion predicate evaluated against virtual state.
- Tiered hints.
- Debrief explaining the command and the concept.
- Optional transfer variant with a changed initial state.

Mission success should be based on resulting state and objective predicates, not solely on exact input strings.

## 8. Error and feedback model

Differentiate:
- Parse error: the input does not fit the supported grammar.
- Unsupported command/flag: syntax is outside the current allowlist.
- Environment error: path, branch, file, or permission state prevents the operation.
- Successful operation with no mission progress: command ran in the simulation but the objective is not yet met.
- Mission complete: completion predicate passed.

Feedback should be concise and actionable. Early missions may offer more guidance; later missions should encourage diagnosis.

## 9. Persistence and platform boundary

Use a `ProgressStore` interface for completed missions, hint usage, and basic progress. The first H5 implementation may use browser-local storage.

Do not couple mission logic directly to browser storage or Xiaohongshu APIs. A later platform adapter can provide the supported persistence and navigation mechanisms if the platform requires them.

## 10. Testing strategy

Unit tests:
- Lexer and parser: quoted strings, spaces in commit messages, malformed input, unsupported syntax, and pipe parsing.
- Command execution: success, errors, and no mutation on rejected input.
- Virtual Git state: staging only selected files, commit contents, branch switching, and merge result.
- Virtual filesystem: path normalization, navigation, search, grep, line counting, and permission changes.
- Mission predicates: expected state completes the mission; nearby incorrect states do not.
- Reset behavior: initial state is restored deterministically.

Integration tests:
- Complete each of the 10 missions using supported commands.
- Replay a mission after reset.
- Complete a transfer variant.
- Exercise the UI at a narrow mobile viewport.

## 11. Build sequence

1. Implement a static mobile-first mission screen with a terminal interaction area.
2. Implement the command parser and virtual state engine with tests.
3. Implement one vertical slice: GIT-01 from briefing through debrief and reset.
4. Add the remaining Git missions.
5. Add the Linux filesystem/text/permission commands and missions.
6. Add progress persistence and transfer variants.
7. Run usability tests before adding polish or expanding the command set.
