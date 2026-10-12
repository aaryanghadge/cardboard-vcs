import { test } from "node:test";
import assert from "node:assert/strict";
import { totalFrames, layoutClips, locate, timecode, focusFrame, windowAround } from "../src/player.mjs";

const clip = (id, inn, out) => ({ id, name: id, in: inn, out });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });
const cut = tl([clip("A", 0, 100), clip("B", 10, 60), clip("C", 0, 30)]); // 100 + 50 + 30 = 180

test("totals and layout", () => {
  assert.equal(totalFrames(cut), 180);
  assert.deepEqual(layoutClips(cut).map((s) => [s.clip.id, s.start, s.end]), [["A", 0, 100], ["B", 100, 150], ["C", 150, 180]]);
});

test("locate finds the clip on screen and its source frame", () => {
  assert.equal(locate(cut, 0).clip.id, "A");
  assert.equal(locate(cut, 99).clip.id, "A");
  const b = locate(cut, 100);
  assert.equal(b.clip.id, "B");
  assert.equal(b.local, 0);
  assert.equal(b.sourceFrame, 10);
  assert.equal(locate(cut, 149).clip.id, "B");
  assert.equal(locate(cut, 150).clip.id, "C");
});

test("locate clamps out-of-range frames and handles an empty timeline", () => {
  assert.equal(locate(cut, -5).clip.id, "A");
  assert.equal(locate(cut, 9999).clip.id, "C");
  assert.equal(locate(tl([]), 0), null);
});

test("timecode formats minutes, seconds and frames", () => {
  assert.equal(timecode(0), "00:00:00");
  assert.equal(timecode(25), "00:01:01");
  assert.equal(timecode(24 * 65 + 3), "01:05:03");
});

test("focusFrame points at the moment each kind of choice is about", () => {
  assert.equal(focusFrame(cut, { type: "same-field", clip: "B", field: "out" }), 150);
  assert.equal(focusFrame(cut, { type: "same-field", clip: "B", field: "in" }), 100);
  assert.equal(focusFrame(cut, { type: "same-field", clip: "B", field: "effect" }), 125);
  assert.equal(focusFrame(cut, { type: "delete-vs-modify", clip: "C" }), 165);
  assert.equal(focusFrame(cut, { type: "same-spot", ids: ["C", "B"] }), 100);
  assert.equal(focusFrame(cut, { type: "same-field", clip: "Z", field: "out" }), null);
});

test("windowAround is five seconds, centred, and stays inside the cut", () => {
  assert.deepEqual(windowAround(cut, 100), { start: 40, end: 160 });
  assert.deepEqual(windowAround(cut, 0), { start: 0, end: 120 });
  assert.deepEqual(windowAround(cut, 180), { start: 60, end: 180 });
  const short = tl([clip("A", 0, 50)]);
  assert.deepEqual(windowAround(short, 25), { start: 0, end: 50 });
});
