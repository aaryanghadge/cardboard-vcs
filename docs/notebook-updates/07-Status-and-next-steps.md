# 7. Status and next steps

## Working now
- [x] Branch, save, combine, go back
- [x] Three-way merge with automatic handling of non-overlapping edits
- [x] All three kinds of choice, resolved in the UI
- [x] Combine with open choices, settle later
- [x] Diff: added, removed, moved, trimmed, changed
- [x] History graph, Edit, Compare, Combine screens
- [x] Persistence in the browser
- [x] 48 engine tests and 24 UI-flow tests
- [x] README and a two-minute demo script
- [x] Preview player: play, scrub, and watch the 5 seconds around any choice (stand-in frames)
- [x] Mini timeline in History, legend in Compare

## Not built (honest list)
- No real footage. The player works but draws stand-in frames.
- No importer for Premiere, Resolve or Final Cut. The timeline format is designed to map to OpenTimelineIO.
- Single user, single browser. Presence, section claims, review and approval need a server.
- Edit shows one track. The engine merges any number.
- Retime and nested effects are plain field changes. Music and captions that follow a clip are not modelled.

## Next steps
- [ ] Merge the final PR and tidy old branches
- [ ] Screenshots (History after a combine, Combine with a choice card) into the README
- [ ] Record the two-minute demo
- [ ] **Plug real footage into the player** (biggest value)
- [ ] OpenTimelineIO import and export
- [ ] Server: presence, claims, review and approval
- [ ] Send Cardboard the repo, screenshots and recording
