# MVP Plan: Terminal Newbie Camp

## Goal

Deliver a small, coherent, mobile-friendly H5 game that proves the core loop: understand an incident, inspect state, type commands, see consequences, and explain the result.

The first release contains 10 deterministic missions. Each mission should be independently testable and resettable.

## Milestone 0 — Playable shell

- [ ] Mobile-first game layout with mission briefing, terminal output, command input, and hint/debrief areas.
- [ ] Terminal input supports Enter to submit and a visible submit control for touch devices.
- [ ] Command history supports at least Up/Down navigation.
- [ ] Output is scrollable and remains readable on narrow screens.
- [ ] A reset action restores the mission's initial state.
- [ ] Unknown or malformed commands produce helpful feedback and do not mutate state.
- [ ] No player input is executed by the host operating system.

## Mission design

### Chapter 1 — Codebase Rescue (Git)

#### GIT-01: The suspicious workspace
**Story:** A teammate asks whether the login fix is ready to commit, but the repository may contain unrelated changes.

- Initial state: On branch `main`; `login.py` and `debug.log` are modified; `test_output.txt` is untracked; nothing is staged.
- Objective: Inspect the current repository state before making changes.
- Intended command: `git status`.
- Completion condition: The player has inspected status and can identify the modified, untracked, and staged categories.
- Learning point: Working tree, staging area, and untracked files are different states.

#### GIT-02: Stage only the fix
**Story:** The login fix is ready, but debug output must not be included.

- Initial state: Same repository changes as GIT-01; nothing staged.
- Objective: Stage `login.py` only.
- Intended command: `git add login.py`.
- Completion condition: `login.py` is staged; `debug.log` and `test_output.txt` are not staged.
- Learning point: Prefer targeted staging when a workspace contains unrelated changes.

#### GIT-03: Leave a useful checkpoint
**Story:** The intended fix is staged. The team needs a traceable checkpoint.

- Initial state: `login.py` staged; unrelated changes remain unstaged.
- Objective: Commit the staged login fix with a meaningful message.
- Intended command: `git commit -m "Fix login validation"`.
- Completion condition: A new commit exists with the staged change and a non-empty message; unrelated unstaged changes remain outside that commit.
- Learning point: A commit records the staged snapshot, not every file in the working directory.

#### GIT-04: Isolate the hotfix
**Story:** The team wants to keep the fix separate from ongoing work.

- Initial state: `main` is checked out; the committed login fix exists.
- Objective: Create and switch to a branch named `fix/login-validation`.
- Intended command: `git switch -c fix/login-validation`.
- Completion condition: The branch exists and is the currently checked-out branch.
- Learning point: Branches provide separate lines of development.

#### GIT-05: Integrate the fix
**Story:** Review is complete. Integrate the hotfix into `main`.

- Initial state: `fix/login-validation` contains the hotfix commit; `main` does not yet contain it.
- Objective: Switch to `main` and merge the hotfix branch.
- Intended sequence: `git switch main`, then `git merge fix/login-validation`.
- Completion condition: `main` contains the hotfix commit or equivalent simulated merge result; the current branch is `main`.
- Learning point: A merge integrates changes from another line of development; switching branches and merging are distinct actions.

### Chapter 2 — Production Incident (Linux)

#### LINUX-01: Find the service directory
**Story:** A service is failing, and the on-call engineer asks you to inspect its logs.

- Initial state: Current directory is `/home/player`; the simulated filesystem contains `/var/log/app/`.
- Objective: Navigate to the service log directory and verify the current location.
- Intended commands: `cd /var/log/app`, `pwd`.
- Completion condition: Current directory is `/var/log/app`.
- Learning point: Relative and absolute paths; current working directory.

#### LINUX-02: Locate the right log
**Story:** Several log files exist. Find the error log without opening every file.

- Initial state: Current directory is `/var/log/app`; files include `access.log`, `app.log`, and `error.log`.
- Objective: Locate `error.log`.
- Intended command: `find /var/log/app -name error.log` (a documented supported subset is sufficient).
- Completion condition: The command returns the path to `error.log`.
- Learning point: Use filesystem search when the target's location is uncertain.

#### LINUX-03: Search for errors
**Story:** The log is large. Identify the lines marked as errors.

- Initial state: `error.log` contains INFO, WARN, and ERROR entries.
- Objective: Display lines containing `ERROR`.
- Intended command: `grep "ERROR" error.log`.
- Completion condition: Output includes all and only matching lines under the simulated matching rules.
- Learning point: Pattern search and filtering command output.

#### LINUX-04: Count the failures
**Story:** The incident report needs the number of error entries, not the full list.

- Initial state: Same log as LINUX-03, with a known number of ERROR lines.
- Objective: Count matching lines by composing commands.
- Intended command: `grep "ERROR" error.log | wc -l`.
- Completion condition: Output count matches the number of lines containing `ERROR`.
- Learning point: A pipe sends one command's output to another command's input; `wc -l` counts lines.

#### LINUX-05: Restore the deploy script
**Story:** The deployment script exists, but the release tool cannot execute it.

- Initial state: `deploy.sh` exists in `/opt/app` but lacks the executable bit.
- Objective: Add execute permission and verify the resulting mode.
- Intended sequence: `chmod +x /opt/app/deploy.sh`, then inspect with the supported `ls -l` behavior.
- Completion condition: The simulated file mode includes execute permission.
- Learning point: File permissions control which operations users can perform.

## Shared interaction rules

- Missions are deterministic and can be reset.
- Players may try supported inspection commands even if they are not the intended answer.
- A wrong command should explain what happened, when possible, without revealing the complete solution immediately.
- Hints are tiered: (1) what to inspect, (2) command shape or concept, (3) a worked example.
- After completion, show the command(s) used, the state change, the underlying concept, and one real-world use case.
- Do not grade solely by exact command-string equality. Grade by mission predicates and resulting virtual state.

## Acceptance criteria

The MVP is ready for a first user test when:

1. All 10 missions can be started, completed, reset, and replayed.
2. Each mission has a deterministic initial state and automated completion predicate.
3. The virtual terminal renders output and errors consistently.
4. The supported commands cannot invoke host execution APIs.
5. Git missions model working tree, index/staging area, commits, branches, and merge state sufficiently for their tasks.
6. Linux missions model current directory, a small virtual filesystem, file contents, and permission bits sufficiently for their tasks.
7. The layout works at a mobile viewport and with touch input.
8. A player can complete the first mission without reading external documentation.
9. The debrief explains why the command worked.
10. At least one transfer variant per chapter changes filenames, paths, or initial state while testing the same concept.

## Explicitly deferred

- Merge conflict resolution.
- Interactive command autocompletion.
- Full shell grammar, scripting, environment variables, and arbitrary pipes.
- Real filesystem or repository access.
- Accounts, analytics backend, and cloud save.
- AI-generated storylines.
