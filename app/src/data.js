// Seed save points. Later these come from the real store.
const clip = (id, name, inn, out, extra = {}) => ({
  id, name, asset: `sha256:${id.toLowerCase()}9f3c`, in: inn, out, ...extra,
});
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });

export const SAVE_POINTS = [
  {
    id: "sp1", title: "Base cut", author: "Priya",
    timeline: tl([clip("A", "Intro", 0, 120), clip("B", "Interview", 0, 80), clip("C", "City b-roll", 0, 60)]),
  },
  {
    id: "sp2", title: "Shorter intro, product shot", author: "Priya",
    timeline: tl([clip("A", "Intro", 0, 100), clip("B", "Interview", 0, 50), clip("M", "Product shot", 0, 30), clip("C", "City b-roll", 0, 60)]),
  },
  {
    id: "sp3", title: "Tighter intro, outro card", author: "Maya",
    timeline: tl([clip("A", "Intro", 10, 120), clip("B", "Interview", 0, 60), clip("C", "City b-roll", 0, 60), clip("T", "Outro card", 0, 40)]),
  },
  {
    id: "sp4", title: "Warm color pass", author: "Dev",
    timeline: tl([clip("A", "Intro", 0, 120, { effect: "grade-warm" }), clip("B", "Interview", 0, 80), clip("C", "City b-roll", 0, 60, { effect: "grade-warm" })]),
  },
  {
    id: "sp5", title: "B-roll opens the film", author: "Maya",
    timeline: tl([clip("C", "City b-roll", 0, 60), clip("A", "Intro", 0, 120), clip("B", "Interview", 0, 80)]),
  },
  {
    id: "sp6", title: "Interview cut for length", author: "Dev",
    timeline: tl([clip("A", "Intro", 0, 120), clip("C", "City b-roll", 0, 60)]),
  },
];
