# 5. Build log

| Step | What | Result |
|---|---|---|
| 1 | Project setup: git, npm, ES modules, .gitignore, GitHub | Repo on GitHub |
| 2 | **Merge engine** (`merge.mjs`) + tests | Three-way merge by clip ID |
| 3 | First feature branch and PR (same-spot test) | PR #1 |
| 4 | **Save-point store** (fork, combine, go back) | PR #2 |
| 5 | **Diff engine** with LCS-based moves | PR #3 |
| 6 | First web UI: colored before/after lanes | PR #4 |
| 7 | **Conflict resolver** (`resolve.mjs`) and its page | PR #5 |
| 8 | `resolveCombine`: a resolution becomes a save point | Resolutions are history |
| 9 | Moved to React + Tailwind. Compare view | Real app shell |
| 10 | Polish: hatched cut frames, fit-to-width timelines, calmer colors | Readable at a glance |
| 11 | **v1 complete:** History graph, Edit, Combine, storage adapters, SHA-256, same-spot resolution, README, demo script | 42 + 15 tests |

| 12 | **Preview player** (play, scrub, 5 seconds around a choice), mini timeline in History, legend in Compare, readable clip labels over stripes | 48 + 24 tests |

## How each step was built
Idea first, then the code, then tests, then a feature branch and a PR. Every engine feature has tests. The UI is tested by driving the real app in a simulated browser.

## Bugs found by tests
- A stale "1 open" badge stayed on an old combine after the choice was resolved. Fixed: only a cut's latest save point can show it.
