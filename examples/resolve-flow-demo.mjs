import { Store } from "../src/store.mjs";
import { MemoryStorage } from "../src/storage.mjs";
import { seedDemoProject } from "../src/demo-project.mjs";
import { keyOf } from "../src/resolve.mjs";

const s = seedDemoProject(new Store(new MemoryStorage()));

const plan = s.previewCombine("maya-intro");
console.log("1. preview ->", plan.status, "| choices needed:", plan.conflicts.length);

const r = s.combine("maya-intro", "Combine maya-intro", { [keyOf(plan.conflicts[0])]: { pick: "theirs" } }, { author: "You" });
console.log("2. combined ->", r.status, "| choices left:", r.conflicts.length);

console.log("3. history (main line):");
s.history().forEach((h) => console.log("  ", h.id, h.message, `(${h.author})`));
