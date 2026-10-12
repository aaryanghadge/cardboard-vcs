# Cardboard VCS: Overview

**One line:** version control for video edits, like GitHub, but in an editor's words.

**For:** Cardboard Inc's problem statement, and my learning project.
**Repo:** github.com/aaryanghadge/cardboard-vcs

## The problem
Code has git. Video has `final_v3_actual (1).mp4`. Teams need to branch, work in parallel, combine, and resolve conflicts without knowing git.

## The answer in three sentences
1. Don't version the video. Version the **edit**: the timeline as small, structured data.
2. Give every clip a **stable ID**, so a moved or trimmed clip is never mistaken for a deleted one.
3. Make **combining never block**: auto-merge everything, and ask a human only where two people truly disagree.

## Snapshot

| | |
|---|---|
| Engine | Merge, diff, resolve, save points, Alt cuts. Plain JavaScript, no dependencies |
| App | React + Vite + Tailwind. Four screens: History, Edit, Compare, Combine |
| Tests | 48 engine tests, 24 UI-flow tests |
| Storage | Browser localStorage (app), files (Node), memory (tests) |
| Not built | Real footage in the player, Premiere/Resolve import, multi-user features |

## Pages in this notebook
1. Problem and approach
2. How merging works
3. Architecture and code map
4. The app, screen by screen
5. Build log
6. Git workflow and lessons learned
7. Status and next steps
8. Glossary and interview talking points
