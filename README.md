# Cardboard VCS

Version control for video edits. Branch a cut, work in parallel, combine the results, and make a choice only where two people truly disagree.

Git versions text and expects you to think in commits and diffs. Editors don't. This project versions the **edit** (the timeline as structured data), never the video files, and speaks in an editor's words.

## The idea

- **Media never changes, so it is never merged.** Footage is stored once, identified by its hash.
- **The timeline is small, structured data.** Tracks hold clips, and every clip has a **stable ID**. A clip keeps its identity when it is moved, trimmed or given an effect, so "moved" is never mistaken for "deleted and re-added".
- **Merging happens per clip, in three layers:** a single value (an out point), a clip (all of its fields), and the order of clips on a track.
- **A combine never blocks.** It always produces a playable timeline. Only real disagreements become choices, and they wait for a human without holding anything up.

### What needs a human (and what does not)

| Situation | Result |
|---|---|
| Two editors changed different clips | Merges automatically |
| One trimmed the in point, the other the out point of the same clip | Merges automatically |
| Both inserted clips in different places | Both kept, ripple handled |
| Same clip, same field, different values | **Choice:** mine, theirs, or a custom value |
| One removed a clip the other edited | **Choice:** keep or remove |
| Both inserted at the very same spot | **Choice:** which plays first |

### Vocabulary

| Git | Cardboard |
|---|---|
| branch | Alt cut |
| commit | Save point |
| merge | Combine |
| conflict | Choice |
| revert | Go back to here |

## Try it

You need Node 20 or newer.

```bash
# the engine and its tests
npm test
npm run resolve-flow

# the app
cd app
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173). The app starts with a sample project: three editors, three Alt cuts, one clean combine and one that needs a choice. Your changes are kept in the browser. **Reset demo** starts over.

Suggested tour (about two minutes, see `docs/demo-script.md`):

1. **History:** the branch graph. Click a save point to see what it changed.
2. **Combine:** bring in `color-pass` (merges with no choices), then `maya-intro` (one choice, everything else automatic). Press **Watch the 5 seconds around it** to play both outcomes side by side, with the moment in question marked.
3. **Edit:** make an Alt cut, trim a clip, save a point. Do the same on `main` and combine to create your own conflict.
4. **Compare:** any two save points, side by side, with the cut frames hatched and a legend that explains the colors. **Preview both cuts** plays them.

## How it is built

```
src/
  merge.mjs         three-way merge over clip IDs
  diff.mjs          semantic diff: added, removed, moved, trimmed, changed
  resolve.mjs       apply a person's choice to a conflict (pure functions)
  player.mjs        which clip is on screen at a frame, and the 5 seconds around a choice
  store.mjs         save points, Alt cuts, combine, resolve, go back
  hash.mjs          SHA-256 in plain JS so IDs match in Node and the browser
  storage.mjs       in-memory and browser (localStorage) storage
  storage-fs.mjs    file storage for Node
  demo-project.mjs  the sample project
app/                React + Vite + Tailwind. Imports the engine from ../src
test/               engine tests (node --test)
examples/           small runnable demos
```

- **Save points are content-addressed.** The ID is a hash of the timeline, parents, message, author and open choices, like a git commit. Save points are never edited, so history stays trustworthy. A combine has two parents.
- **The engine is storage-agnostic.** The store talks to a small adapter interface, so the same code runs against files (Node), memory (tests) and localStorage (browser).
- **One engine, two consumers.** The app imports the same files the tests run. The UI contains no merge logic of its own.

## Tests

```bash
npm test                 # engine: 48 tests
cd app && npm test       # UI flows and the player in a simulated browser: 24 tests
```

The UI tests drive the real app: combining cleanly, each of the three kinds of choice, watching a choice before deciding, deciding now or later, editing, forking, going back, previewing, and persistence across a reload. The player is tested in real time with fake timers.

## What is not built yet

This is a working prototype of the hard part, not a finished product.

- **No real footage yet.** The preview player works (play, scrub, the 5 seconds around a choice) but draws stand-in frames. Plugging real media into it is the most valuable next step.
- **No importer.** The timeline format is designed to map to OpenTimelineIO so Premiere, Resolve and Final Cut projects can be brought in. That adapter is not written.
- **Single user, single browser.** Presence ("Maya is editing 0:30 to 1:10"), section claims, review and approval before a combine all need a server.
- **One track in the editor.** The engine merges any number of tracks. The Edit screen shows the first.
- **Retime and nested effects** are treated as plain field changes. Anchored items (music and captions that follow a clip) are not modelled yet.
