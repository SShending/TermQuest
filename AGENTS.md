# AGENTS.md

## Project purpose

Build TermQuest: a story-driven, mobile-first H5 game that teaches Git and Linux through realistic developer missions in a controlled virtual terminal. The first milestone is the 10-mission MVP described in `docs/mvp-plan.md`.

Before making substantial changes, read:
- `README.md`
- `docs/product-brief.md`
- `docs/mvp-plan.md`
- `docs/architecture.md`

## Core constraints

1. **Never execute player input on the host.** Do not pass terminal input to a shell, `exec`, `spawn`, `child_process`, `eval`, or an equivalent execution mechanism.
2. Implement a small, explicit command allowlist in a simulated environment. Do not claim to implement full Bash or full Git.
3. A rejected or unsupported command must not mutate game state.
4. Judge mission completion by the resulting virtual state and mission predicates, not only by exact string matching.
5. Keep mission state deterministic and resettable.
6. Keep UI, parsing, simulation, mission rules, and persistence separated.
7. Prioritize mobile usability and short, understandable missions.
8. Do not add a backend, account system, LLM dependency, multiplayer, or complex progression economy without a clear requirement and an explicit design decision.

## Development workflow

- Make small, coherent changes that produce a playable increment.
- Prefer completing one end-to-end vertical slice before building abstractions for hypothetical future features.
- Add tests for parser behavior, state transitions, mission completion, and reset behavior alongside implementation.
- Run the relevant tests, type checks, and lint checks available in the repository before reporting completion.
- Do not claim tests passed unless they were actually run; state any unverified behavior explicitly.
- Keep documentation aligned with actual behavior and supported commands.
- Avoid adding dependencies unless they materially improve the MVP.
- Do not create placeholder modules or empty documentation files without an immediate purpose.

## Terminal and simulation requirements

- Parse only documented syntax.
- Explicitly handle quoted commit messages and the supported pipe syntax.
- Do not silently ignore unsupported flags or extra arguments.
- Separate parse errors, unsupported commands, environment errors, and successful commands that do not yet complete the mission.
- Model only the filesystem and Git semantics needed by current missions, but avoid simplifications that teach incorrect core concepts.
- Provide useful output and recovery guidance for common mistakes.

## Product decisions

- Current target: independent H5 prototype, then evaluate adaptation to Xiaohongshu.
- Current stack direction: TypeScript + React + Vite, with Vitest for tests.
- First content: five Git missions and five Linux missions.
- AI-generated missions and unrestricted terminal execution are out of scope for the MVP.

## Definition of done

A feature is complete only when:
- The intended behavior is implemented.
- Relevant tests cover success and failure paths.
- Unsupported input is safe and predictable.
- The mobile interface remains usable where UI is affected.
- Documentation is updated if behavior, commands, or scope changed.
- Verification results and known limitations are reported accurately.
