# 4. The app, screen by screen

Header: **Alt cut** menu (switch), **New Alt cut** (branch), **Reset demo** (restore sample data). Data lives in the browser's localStorage.

## History
- Branch graph: one lane per Alt cut, curves where cuts branch and join.
- Click a save point to see what it changed.
- A mini timeline of the selected save point sits above its change list.
- Actions: Compare with previous, Resolve open choices, Go back to here.
- Badges mark each cut's latest save point. "N open" marks unresolved choices.

## Edit
A stand-in for a real editing app.
- Select a clip: change in point, out point, effect. Move earlier or later. Remove it.
- Add a clip after the selected one.
- Pending changes are listed live. Save point writes a new version.
- Used to create your own conflicts for demos.

## Compare
- Pick any two save points. Before and After timelines share one scale.
- Cut frames are hatched red in Before. Added frames hatched green in After.
- Change list with filter chips. Click a change or a clip to inspect it.
- A legend explains the colors and the stripes.
- **Preview both cuts** plays Before and After side by side (stand-in frames).

## Combine
1. Choose an Alt cut to bring in.
2. See what each side changed since they split.
3. See the result timeline. Clips needing a decision are flagged.
4. Choice cards: length bars for trims, keep/remove, or ordering.
   **Watch the 5 seconds around it** plays both outcomes side by side, with the moment in question marked. Editors decide by watching.
5. **Combine** when all decided, or **Combine, leave N open** to decide later.
6. If the current cut already has open choices, they appear at the top to resolve.

## Sample project
Three editors, three Alt cuts, five save points.
- `color-pass` into `main`: merges with no choices.
- `maya-intro` into `main`: exactly one choice.
