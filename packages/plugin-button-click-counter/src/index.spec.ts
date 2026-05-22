import { pressKey, startTimeline } from "@jspsych/test-utils";

import buttonClickCounter from ".";

jest.useFakeTimers();

describe("button-click-counter", () => {
  it("displays a button with the default label", async () => {
    const { getHTML } = await startTimeline([
      {
        type: buttonClickCounter,
      },
    ]);

    expect(getHTML()).toContain("Click me!");
    expect(getHTML()).toContain("<button");
  });

  it("displays a button with a custom label", async () => {
    const { getHTML } = await startTimeline([
      {
        type: buttonClickCounter,
        button_label: "Press here",
      },
    ]);

    expect(getHTML()).toContain("Press here");
  });

  it("displays the initial click count as 0", async () => {
    const { getHTML } = await startTimeline([
      {
        type: buttonClickCounter,
      },
    ]);

    expect(getHTML()).toContain("Button clicks:");
    expect(
      getHTML().includes(">0<") || getHTML().includes(">0 <") || getHTML().includes("value\">0")
    ).toBe(true);
  });

  it("increments the click counter when the button is clicked", async () => {
    const { displayElement } = await startTimeline([
      {
        type: buttonClickCounter,
      },
    ]);

    const btn = displayElement.querySelector<HTMLButtonElement>(
      "#jspsych-button-click-counter-btn"
    );
    btn.click();
    expect(displayElement.querySelector("#jspsych-button-click-counter-value").textContent).toBe(
      "1"
    );
    btn.click();
    expect(displayElement.querySelector("#jspsych-button-click-counter-value").textContent).toBe(
      "2"
    );
  });

  it("displays a prompt when provided", async () => {
    const { getHTML } = await startTimeline([
      {
        type: buttonClickCounter,
        prompt: "<p>Press any key to continue</p>",
      },
    ]);

    expect(getHTML()).toContain("Press any key to continue");
  });

  it("ends the trial when any key is pressed (key_to_advance is null)", async () => {
    const { expectFinished, getData } = await startTimeline([
      {
        type: buttonClickCounter,
      },
    ]);

    await pressKey("Enter");
    await expectFinished();

    expect(getData().values()[0].key_pressed).toBe("Enter");
  });

  it("ends the trial only when the specified key is pressed", async () => {
    const { expectRunning, expectFinished, getData } = await startTimeline([
      {
        type: buttonClickCounter,
        key_to_advance: "Enter",
      },
    ]);

    await pressKey("a");
    await expectRunning();

    await pressKey("Enter");
    await expectFinished();

    expect(getData().values()[0].key_pressed).toBe("Enter");
  });

  it("records the correct number of button clicks in trial data", async () => {
    const { expectFinished, getData, displayElement } = await startTimeline([
      {
        type: buttonClickCounter,
      },
    ]);

    const btn = displayElement.querySelector<HTMLButtonElement>(
      "#jspsych-button-click-counter-btn"
    );
    btn.click();
    btn.click();
    btn.click();

    await pressKey("Enter");
    await expectFinished();

    expect(getData().values()[0].button_clicks).toBe(3);
  });

  it("records rt and key_pressed in trial data", async () => {
    const { expectFinished, getData } = await startTimeline([
      {
        type: buttonClickCounter,
      },
    ]);

    jest.advanceTimersByTime(500);
    await pressKey("Space");
    await expectFinished();

    const data = getData().values()[0];
    expect(data.key_pressed).toBe("Space");
    expect(data.rt).toBeGreaterThan(0);
  });

  it("clears the display after the trial ends", async () => {
    const { expectFinished, getHTML } = await startTimeline([
      {
        type: buttonClickCounter,
      },
    ]);

    await pressKey("Enter");
    await expectFinished();

    expect(getHTML()).toBe("");
  });
});
