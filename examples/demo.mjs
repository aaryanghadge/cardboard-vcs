import { merge } from "../src/merge.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });

const base = tl([clip("A", 0, 120), clip("B", 0, 80), clip("C", 0, 60)]);
const mine = tl([clip("A", 0, 100), clip("B", 0, 50), clip("M", 0, 30), clip("C", 0, 60)]);
const theirs = tl([clip("A", 10, 120), clip("B", 0, 60), clip("C", 0, 60), clip("T", 0, 40)]);

const { timeline, conflicts } = merge(base, mine, theirs);
console.log(JSON.stringify(timeline, null, 2));
console.log("CONFLICTS:", conflicts);
