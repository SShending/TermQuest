# TermQuest

**Learn by doing. One command at a time.**

TermQuest is a story-driven terminal adventure game for learning Git and Linux through simulated developer tasks. Players solve incidents by typing commands into a safe, deterministic virtual terminal—not by answering multiple-choice questions or executing commands on a real machine.

The first target is an independent H5 prototype. Once the core gameplay is validated, the experience can be adapted to Xiaohongshu's mini-component ecosystem, subject to its current platform capabilities and review requirements.

## Product direction

- **Genre:** Story-driven adventure and task-based progression.
- **Learning loop:** Read the incident → inspect the environment → enter commands → observe state changes → complete the objective → review the concept.
- **Terminal:** A controlled virtual environment with an allowlisted command set; never execute arbitrary player input through the host shell.
- **Audience:** Learners who want practical confidence with Git and Linux, especially students and early-career developers.
- **Principle:** Teach transferable problem-solving, not memorization of one exact command string.

## MVP: Terminal Newbie Camp

The first playable build will contain 10 short missions:

### Git storyline — Codebase Rescue
1. Inspect the repository state with `git status`.
2. Stage only the intended file.
3. Commit staged changes with a meaningful message.
4. Create and switch to a feature branch.
5. Merge the completed feature branch into the main branch.

### Linux storyline — Production Incident
6. Navigate to the service log directory.
7. Locate a target log file.
8. Search logs for error entries.
9. Combine commands with a pipe to count matching errors.
10. Diagnose and fix an executable-permission problem in the simulated environment.

Each mission needs a clear objective, a deterministic starting state, observable command output, a verifiable completion condition, and a concise explanation after completion.

## Initial technical direction

- H5 prototype: TypeScript + React + Vite.
- Game logic: deterministic mission definitions and state transitions.
- Virtual terminal: allowlisted command parser and simulated filesystem/Git repository.
- Persistence: page-memory progress for the current prototype; no account system or backend is required.
- Testing: unit tests for command parsing, state transitions, and mission completion.

These are MVP defaults, not commitments to a final Xiaohongshu integration architecture.

## Safety and scope

- Never pass player-entered commands to `exec`, `spawn`, a shell, or an equivalent host execution API.
- Do not claim to emulate all of Bash or all of Git. Clearly define the supported command subset.
- Unsupported commands should return useful feedback without changing state.
- Keep the first version deterministic. AI-generated missions and multiplayer are out of scope until the core loop is validated.

## Project documents

- [Product brief](docs/product-brief.md)
- [MVP plan and mission list](docs/mvp-plan.md)
- [Architecture](docs/architecture.md)
- [Agent and contributor instructions](AGENTS.md)

## Play the first two missions

The current build contains two complete, resettable missions:

- **GIT-01 — The Suspicious Workspace:** inspect a deterministic repository and identify modified and untracked files.
- **GIT-02 — Stage Only the Fix:** stage `login.py` without including `debug.log` or `test_output.txt`; recover safely from a wrong staging choice with `git restore --staged`.

Each mission includes a narrative briefing, live simulated repository, tiered hints, completion detection, and a debrief. GIT-01's debrief links directly to GIT-02.

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser. The terminal is the primary game surface, and the active prompt follows the terminal history instead of being pinned in a separate input bar. On first entry, the mission briefing opens automatically in a drawer; after that, the persistent dock opens the briefing, task status, tiered hints, and—once unlocked—the completion debrief. The drawer slides up from the bottom on mobile and in from the right on desktop. Its neutral dark material, platform font stacks, reduced-motion behavior, and compact controls are designed for both macOS and Linux terminal users without depending on either operating system.

Completing the mission does not cover the terminal automatically. A completion banner and dock entry let the player open the debrief when ready. Reset closes any open drawer and returns directly to a fresh terminal.

### Supported terminal input

The current prototype deliberately supports only this grammar:

```text
# Available in GIT-01 and GIT-02
git status

# Available after entering GIT-02
git add <single-root-file>
git add .
git restore --staged <single-root-file>
```

Leading and trailing whitespace is accepted. GIT-02 supports the three repository files (`login.py`, `debug.log`, and `test_output.txt`) by name. Other commands, flags, multiple paths, nested or parent paths, absolute paths, pipes, redirects, command chaining, command substitution, and globbing are rejected with explanatory output. Rejected input does not change the simulated repository. Empty input is handled without changing mission progress.

All terminal behavior runs against in-memory game data. Player input is never passed to a host shell, a real Git installation, the host filesystem, or an execution API.

### Available scripts

```bash
npm run dev        # start the Vite development server
npm test           # run the Vitest unit tests
npm run typecheck  # run TypeScript without emitting files
npm run build      # type-check and create a production build in dist/
npm run preview    # preview the production build locally
```

## Development status

**Stage:** Playable GIT-01 and GIT-02 vertical slices.

Implemented: mission registry, deterministic virtual Git state with a mutable index, allowlisted command parsing, `git status`, `git add`, `git restore --staged`, mission completion predicates, tiered hints, completion debriefs, command history, and reset/replay. The remaining eight missions and their commands are not implemented yet. The terminal is a focused teaching simulation, not a complete Bash or Git emulator.
