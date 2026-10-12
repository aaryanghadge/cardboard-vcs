// A realistic sample project: three editors, three Alt cuts, one clean combine and one with a choice.
const clip = (id, name, inn, out, extra = {}) => ({
  id, name, asset: `sha256:${id.toLowerCase()}9f3c`, in: inn, out, ...extra,
});
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export function seedDemoProject(store, now = Date.now()) {
  store.save(
    tl([clip("A", "Intro", 0, 120), clip("B", "Interview", 0, 80), clip("C", "City b-roll", 0, 60)]),
    "Base cut", { author: "Priya", time: now - 3 * DAY }
  );

  store.fork("maya-intro");
  store.save(
    tl([clip("A", "Intro", 10, 120), clip("B", "Interview", 0, 60), clip("C", "City b-roll", 0, 60), clip("T", "Outro card", 0, 40)]),
    "Tighter intro, add outro card", { author: "Maya", time: now - 2 * DAY }
  );

  store.switchTo("main");
  store.save(
    tl([clip("A", "Intro", 0, 100), clip("B", "Interview", 0, 50), clip("M", "Product shot", 0, 30), clip("C", "City b-roll", 0, 60)]),
    "Shorter intro, product shot", { author: "Priya", time: now - 1.5 * DAY }
  );

  store.fork("color-pass");
  store.save(
    tl([clip("A", "Intro", 0, 100, { effect: "grade-warm" }), clip("B", "Interview", 0, 50), clip("M", "Product shot", 0, 30), clip("C", "City b-roll", 0, 60, { effect: "grade-warm" })]),
    "Warm grade on intro and b-roll", { author: "Dev", time: now - 1 * DAY }
  );

  store.switchTo("main");
  store.save(
    tl([clip("A", "Intro", 0, 100), clip("B", "Interview", 0, 50, { effect: "lower-third" }), clip("M", "Product shot", 0, 30), clip("C", "City b-roll", 0, 60)]),
    "Lower third on the interview", { author: "Priya", time: now - 5 * HOUR }
  );
  return store;
}
