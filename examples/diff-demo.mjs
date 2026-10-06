import { diff, describe } from "../src/diff.mjs";

const clip = (id, inn, out) => ({ id, asset: "sha256:" + id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });

const base = tl([clip("A", 0, 120), clip("B", 0, 80), clip("C", 0, 60)]);
const edited = tl([clip("A", 0, 100), clip("B", 0, 50), clip("M", 0, 30), clip("C", 0, 60)]);

const ops = diff(base, edited);
console.log(ops);
console.log("");
ops.forEach((op) => console.log(describe(op)));
