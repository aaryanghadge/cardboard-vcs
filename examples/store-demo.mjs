import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../src/store.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });

const s = new Store(mkdtempSync(join(tmpdir(), "cb-")));

s.save(tl([clip("A", 0, 120), clip("B", 0, 80), clip("C", 0, 60)]), "Base cut");

s.fork("maya");
s.save(tl([clip("A", 10, 120), clip("B", 0, 60), clip("C", 0, 60), clip("T", 0, 40)]), "Maya: tighter intro + outro");

s.switchTo("main");
s.save(tl([clip("A", 0, 100), clip("B", 0, 50), clip("M", 0, 30), clip("C", 0, 60)]), "Main: shorter A, new B-roll M");

const result = s.combine("maya");
console.log("status:", result.status);
console.log("conflicts:", result.conflicts);
console.log("history:", s.history());
