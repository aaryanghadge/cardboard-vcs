// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import Player from "./ui/Player.jsx";

const clip = (id, name, inn, out, extra = {}) => ({ id, name, asset: "sha256:x", in: inn, out, ...extra });
const tl = (clips) => ({ tracks: [{ id: "V1", clips }] });
const cut = tl([clip("A", "Intro", 0, 48), clip("B", "Interview", 0, 48, { effect: "lower-third" })]); // 96 frames

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Player", () => {
  it("shows the clip on screen and its timecode", () => {
    render(<Player label="Main" timeline={cut} />);
    expect(screen.getByRole("img", { name: /Main: Intro at 00:00:00/ })).toBeTruthy();
    expect(screen.getByText("stand-in frame")).toBeTruthy();
  });

  it("scrubbing moves into the next clip and shows its effect", () => {
    render(<Player label="Main" timeline={cut} />);
    fireEvent.change(screen.getByLabelText("Scrub Main"), { target: { value: "60" } });
    expect(screen.getByRole("img", { name: /Interview at 00:02:12/ })).toBeTruthy();
    expect(screen.getByText("lower-third")).toBeTruthy();
  });

  it("plays in real time and stops at the end", () => {
    vi.useFakeTimers();
    render(<Player label="Main" timeline={cut} />);
    fireEvent.click(screen.getByRole("button", { name: "Play Main" }));
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText("00:00:12")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pause Main" })).toBeTruthy();
    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByText("00:03:23")).toBeTruthy();            // last frame, 95
    expect(screen.getByRole("button", { name: "Play Main" })).toBeTruthy(); // stopped itself
  });

  it("pressing play at the end starts again from the beginning of the window", () => {
    vi.useFakeTimers();
    render(<Player label="Main" timeline={cut} />);
    fireEvent.change(screen.getByLabelText("Scrub Main"), { target: { value: "95" } });
    fireEvent.click(screen.getByRole("button", { name: "Play Main" }));
    act(() => { vi.advanceTimersByTime(125); });
    expect(screen.getByText("00:00:03")).toBeTruthy();
  });

  it("limits playback to a window of the cut", () => {
    render(<Player label="Win" timeline={cut} start={24} end={48} />);
    const scrub = screen.getByLabelText("Scrub Win");
    expect(scrub.min).toBe("24");
    expect(scrub.max).toBe("47");
    expect(screen.getByText("00:01:00")).toBeTruthy();
  });

  it("says so when there is nothing to play", () => {
    render(<Player label="Empty" timeline={tl([])} />);
    expect(screen.getByText(/nothing to play/)).toBeTruthy();
  });
});
