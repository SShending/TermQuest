# TermQuest Product Brief

## 1. Product concept

TermQuest is a lightweight, story-driven learning game in which players act as developers responding to realistic incidents. They learn Git and Linux by entering commands into a simulated terminal and observing how the environment changes.

It should feel like solving a small workplace mystery, not completing a textbook exercise.

**Positioning:** Learn practical developer commands through short, playable missions.

**Working tagline:** Learn by doing. One command at a time.

## 2. Target users

Primary users:
- Students who have learned programming but feel uncertain when using Git or Linux.
- Beginners who copy commands from tutorials but do not yet understand when or why to use them.
- Developers who want low-pressure practice with everyday terminal workflows.

The product should assume basic familiarity with code, but not require prior terminal expertise.

## 3. Core experience

Every mission follows this loop:

1. **Incident briefing:** A short narrative explains what went wrong and what must be achieved.
2. **Inspect:** The player decides what to check before acting.
3. **Act:** The player types a command into the virtual terminal.
4. **Observe:** The terminal returns output and the simulated environment changes when appropriate.
5. **Verify:** The game checks the actual resulting state, not merely whether the input matches a reference string.
6. **Debrief:** The game explains the command, the reasoning behind it, and a real-world situation where it is useful.

The player should be allowed to explore and make recoverable mistakes. Avoid punishing experimentation in early levels.

## 4. Product principles

### Learn through consequences
Commands should have visible effects on simulated repository, filesystem, branch, staging, commit, or permission state.

### Verify outcomes, not exact strings
Equivalent supported command forms may succeed when they produce the required state. Do not rely only on string equality.

### Teach diagnosis before memorization
A mission should provide enough environmental evidence for a player to decide what to inspect next. Hints should scaffold reasoning rather than reveal the full answer immediately.

### Keep sessions short
A typical mission should take approximately 1–3 minutes. A session should be completable on a mobile screen.

### Be honest about the simulation
The virtual terminal supports a deliberately limited command subset. It must not pretend to be a full Linux shell or unrestricted Git installation.

## 5. Narrative frame

The player joins a small engineering team as a junior developer. Each chapter is a realistic incident:

- **Codebase Rescue:** prevent accidental files from entering a commit, organize work on a feature branch, and integrate a fix.
- **Production Incident:** navigate service directories, find relevant logs, identify error patterns, and repair a permission issue.

Narrative text should make the task understandable but must not obscure the real technical objective.

## 6. Progression and feedback

MVP feedback:
- Mission completion state.
- Commands used and hints consumed.
- Short debrief with command purpose and key concept.
- Chapter progress and a simple completion summary.

Do not add a complex XP economy, inventory, character stats, social leaderboard, or AI tutor before validating the core learning loop.

## 7. H5 and Xiaohongshu strategy

### Phase A: independent H5
Validate whether the mission loop is fun, understandable, and educational. Prioritize mobile layout, fast loading, touch-friendly controls, and shareable completion results.

### Phase B: Xiaohongshu adaptation
After the H5 loop works, investigate the current mini-component or mini-program capabilities, including navigation, persistence, viewport limits, input behavior, and review requirements. Do not assume the platform supports a full-screen terminal or unrestricted browser APIs.

The platform adaptation should preserve the game loop rather than force the entire product into a constrained surface.

## 8. Success criteria for the first prototype

Qualitative checks:
- A first-time player understands the objective without external explanation.
- The player can recover from a wrong command.
- Terminal output and environment changes are coherent.
- The debrief explains why the successful command worked.
- The game is usable on a narrow mobile viewport.

Quantitative checks to gather during testing:
- Mission start-to-completion rate.
- Time to completion.
- Commands and hints used per mission.
- Ability to solve a changed version of the same task after a delay.

Completion alone is not proof of learning. Include small transfer checks with changed filenames, paths, or repository states.

## 9. Non-goals for MVP

- A complete Bash or Git implementation.
- Executing commands on the user's real machine.
- Accounts, cloud sync, multiplayer, or competitive ranking.
- LLM-generated commands or missions.
- Exhaustive coverage of advanced Git and Linux.
- A production Xiaohongshu integration before the H5 prototype is validated.
