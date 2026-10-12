// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

beforeEach(() => { cleanup(); localStorage.clear(); });

const tab = (name) => screen.getByRole("button", { name });
// A title shows in the History list AND in the detail panel, so look in the list.
const inList = () => within(screen.getByRole("list", { name: /Save points/ }));

describe("Cardboard app", () => {
  it("shows the seeded history with Alt cut badges and one graph", async () => {
    render(<App />);
    expect(inList().getByText("Base cut")).toBeTruthy();
    expect(inList().getByText("Lower third on the interview")).toBeTruthy();
    expect(inList().getByText("Warm grade on intro and b-roll")).toBeTruthy();
    expect(document.querySelectorAll("svg circle").length).toBeGreaterThanOrEqual(5);
  });

  it("selecting a save point shows what changed and can jump to Compare", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("Shorter intro, product shot"));
    expect(screen.getByText(/out point -20 frames/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Compare with previous" }));
    expect(screen.getByLabelText("Before")).toBeTruthy();
    expect(screen.getByLabelText("After")).toBeTruthy();
  });

  it("combines color-pass cleanly in one click", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab("Combine"));
    await user.selectOptions(screen.getByRole("combobox", { name: /Bring in/ }), "color-pass");
    expect(screen.getByText(/No choices needed/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Combine into main" }));
    expect(inList().getByText("Combine color-pass")).toBeTruthy();
  });

  it("maya-intro needs one choice; deciding it enables a clean combine", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab("Combine"));
    await user.selectOptions(screen.getByRole("combobox", { name: /Bring in/ }), "maya-intro");
    expect(screen.getByText(/1 choice for you/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Combine, leave 1 open/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Use maya-intro's" }));
    expect(screen.getByRole("button", { name: "Combine into main" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Combine into main" }));
    expect(inList().getByText("Combine maya-intro")).toBeTruthy();
    expect(screen.queryByText(/1 open/)).toBeNull();
  });

  it("can combine now and resolve the open choice later", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab("Combine"));
    await user.selectOptions(screen.getByRole("combobox", { name: /Bring in/ }), "maya-intro");
    await user.click(screen.getByRole("button", { name: /Combine, leave 1 open/ }));
    expect(screen.getByText("1 open")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Resolve open choices" }));
    expect(screen.getByRole("region", { name: "Open choices" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Use main's" }));
    await user.click(screen.getByRole("button", { name: /Save 1 choice/ }));
    await user.click(tab("History"));
    expect(inList().getByText("Resolved open choices")).toBeTruthy();
    expect(screen.queryByText("1 open")).toBeNull();
  });

  it("custom value resolves a trim conflict", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab("Combine"));
    await user.selectOptions(screen.getByRole("combobox", { name: /Bring in/ }), "maya-intro");
    await user.type(screen.getByLabelText("Custom value"), "55");
    await user.click(screen.getByRole("button", { name: "Use custom" }));
    expect(screen.getByRole("button", { name: "Combine into main" })).toBeTruthy();
  });

  it("edit, save a point, and it appears in history", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab("Edit"));
    await user.click(screen.getByRole("button", { name: /Interview/ }));
    const out = screen.getByLabelText("Out point");
    await user.clear(out);
    await user.type(out, "40");
    expect(screen.getByText(/out point -10 frames/)).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Describe this edit"), "Trim the interview");
    await user.click(screen.getByRole("button", { name: "Save point" }));
    expect(inList().getByText("Trim the interview")).toBeTruthy();
  });

  it("editing blocks saving an invalid trim", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab("Edit"));
    await user.click(screen.getByRole("button", { name: /Interview/ }));
    const out = screen.getByLabelText("Out point");
    await user.clear(out);
    await user.type(out, "0");
    expect(screen.getByRole("button", { name: "Save point" }).disabled).toBe(true);
    expect(screen.getByText(/at or before its in point/)).toBeTruthy();
  });

  it("a new Alt cut can be created, edited, and shows as its own badge", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "New Alt cut" }));
    await user.type(screen.getByLabelText("New Alt cut name"), "sound-mix");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByRole("combobox", { name: /Alt cut/ }).value).toBe("sound-mix");
    await user.click(tab("Edit"));
    await user.click(screen.getByRole("button", { name: "Add at the end" }));
    await user.type(screen.getByPlaceholderText("Describe this edit"), "Add a sting");
    await user.click(screen.getByRole("button", { name: "Save point" }));
    const row = inList().getByText("Add a sting").closest("button");
    expect(within(row).getByText("sound-mix")).toBeTruthy();
  });

  it("duplicate Alt cut names show an error instead of crashing", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "New Alt cut" }));
    await user.type(screen.getByLabelText("New Alt cut name"), "maya-intro");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByRole("alert").textContent).toMatch(/already exists/);
  });

  it("go back to here moves the current cut, and reset restores the demo", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(inList().getByText("Base cut"));
    await user.click(screen.getByRole("button", { name: /Go back to here on main/ }));
    // main now ends at the Base cut, so that button is gone and the badge moved
    expect(screen.queryByRole("button", { name: /Go back to here on main/ })).toBeNull();
    const row = inList().getByText("Base cut").closest("button");
    expect(within(row).getByText("main")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    const latest = inList().getByText("Lower third on the interview").closest("button");
    expect(within(latest).getByText("main")).toBeTruthy();
  });

  it("compare works for every pair of save points without crashing", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(tab("Compare"));
    const [base, head] = within(screen.getByRole("main")).getAllByRole("combobox");
    const ids = [...base.querySelectorAll("option")].map((o) => o.value);
    for (const a of ids) for (const b of ids) {
      await user.selectOptions(base, a);
      await user.selectOptions(head, b);
      expect(screen.getByLabelText("Before")).toBeTruthy();
    }
  });

  it("persists across a reload (same browser storage)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(tab("Combine"));
    await user.selectOptions(screen.getByRole("combobox", { name: /Bring in/ }), "color-pass");
    await user.click(screen.getByRole("button", { name: "Combine into main" }));
    unmount();
    render(<App />);
    expect(inList().getByText("Combine color-pass")).toBeTruthy();
  });

  async function newCut(user, name) {
    await user.click(screen.getByRole("button", { name: "New Alt cut" }));
    await user.type(screen.getByLabelText("New Alt cut name"), name);
    await user.click(screen.getByRole("button", { name: "Create" }));
  }

  it("removed-vs-edited shows a choice card and resolves", async () => {
    const user = userEvent.setup();
    render(<App />);
    await newCut(user, "cleanup");
    await user.click(tab("Edit"));
    await user.click(screen.getByRole("button", { name: /^Interview/ }));
    await user.click(screen.getByRole("button", { name: "Remove clip" }));
    await user.click(screen.getByRole("button", { name: "Save point" }));

    await user.selectOptions(screen.getByRole("combobox", { name: /Alt cut/ }), "main");
    await user.click(tab("Edit"));
    await user.click(screen.getByRole("button", { name: /^Interview/ }));
    const out = screen.getByLabelText("Out point");
    await user.clear(out);
    await user.type(out, "40");
    await user.click(screen.getByRole("button", { name: "Save point" }));

    await user.click(tab("Combine"));
    await user.selectOptions(screen.getByRole("combobox", { name: /Bring in/ }), "cleanup");
    expect(screen.getByText(/removed and edited/)).toBeTruthy();
    expect(screen.getByText(/cleanup removed this clip while main edited it/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Remove the clip" }));
    await user.click(screen.getByRole("button", { name: "Combine into main" }));
    expect(inList().getByText("Combine cleanup")).toBeTruthy();
  });

  it("same-spot inserts show an ordering choice and resolve", async () => {
    const user = userEvent.setup();
    render(<App />);
    await newCut(user, "stings");
    await user.click(tab("Edit"));
    await user.click(screen.getByRole("button", { name: /^Intro/ }));
    const name = screen.getByLabelText("New clip name");
    await user.clear(name);
    await user.type(name, "Sting A");
    await user.click(screen.getByRole("button", { name: /Add after Intro/ }));
    await user.click(screen.getByRole("button", { name: "Save point" }));

    await user.selectOptions(screen.getByRole("combobox", { name: /Alt cut/ }), "main");
    await user.click(tab("Edit"));
    await user.click(screen.getByRole("button", { name: /^Intro/ }));
    const name2 = screen.getByLabelText("New clip name");
    await user.clear(name2);
    await user.type(name2, "Sting B");
    await user.click(screen.getByRole("button", { name: /Add after Intro/ }));
    await user.click(screen.getByRole("button", { name: "Save point" }));

    await user.click(tab("Combine"));
    await user.selectOptions(screen.getByRole("combobox", { name: /Bring in/ }), "stings");
    expect(screen.getByText(/added in the same spot/)).toBeTruthy();
    const choices = screen.getAllByRole("button", { name: /, then / });
    expect(choices.length).toBe(2);
    await user.click(choices[1]);
    await user.click(screen.getByRole("button", { name: "Combine into main" }));
    expect(inList().getByText("Combine stings")).toBeTruthy();
  });
});
