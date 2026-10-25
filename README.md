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
- Persistence: local progress only for the first prototype; no account system or backend required initially.
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

## Development status

**Stage:** Product definition and prototype planning.

The first milestone is a polished, playable vertical slice—not a complete terminal emulator.
