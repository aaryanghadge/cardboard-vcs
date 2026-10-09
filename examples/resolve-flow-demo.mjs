import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../src/store.mjs";
import { keyOf } from "../src/resolve.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });
const s = new Store(mkdtempSync(join(tmpdir(), "cb-")));

s.save(tl([clip("A", 0, 120), clip("B", 0, 80), clip("C", 0, 60)]), "Base cut");
s.fork("maya");
s.save(tl([clip("A", 10, 120), clip("B", 0, 60), clip("C", 0, 60), clip("T", 0, 40)]), "Maya: tighter intro + outro");
s.switchTo("main");
s.save(tl([clip("A", 0, 100), clip("B", 0, 50), clip("M", 0, 30), clip("C", 0, 60)]), "Main: shorter A, new B-roll M");

const r = s.combine("maya");
console.log("1. combine ->", r.status, "| conflicts:", r.conflicts.length);

const id = s.resolveCombine({ [keyOf(r.conflicts[0])]: { pick: "theirs" } }, "Chose Maya's trim for B");
const sp = s.get(id);
console.log("2. resolved -> conflicts left:", sp.conflicts.length, "| B.out =", sp.timeline.tracks[0].clips.find((c) => c.id === "B").out);
console.log("3. history:");
s.history().forEach((h) => console.log("  ", h.id, h.message));
