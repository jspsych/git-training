import { pressKey, startTimeline } from "@jspsych/test-utils";

import emojiScreen from ".";

jest.useFakeTimers();

describe("emoji-screen", () => {
  it("displays the canvas area and default prompt", async () => {
    const { getHTML } = await startTimeline([
      {
        type: emojiScreen,
      },
    ]);

    expect(getHTML()).toContain("jspsych-emoji-screen-canvas");
    expect(getHTML()).toContain("Click anywhere");
  });

  it("displays a custom prompt when provided", async () => {
    const { getHTML } = await startTimeline([
      {
        type: emojiScreen,
        prompt: "<p>Place your emojis!</p>",
      },
    ]);

    expect(getHTML()).toContain("Place your emojis!");
  });

  it("places an emoji on the canvas when clicked", async () => {
    const { displayElement } = await startTimeline([
      {
        type: emojiScreen,
        emojis: ["🎉"],
      },
    ]);

    const canvas = displayElement.querySelector<HTMLDivElement>("#jspsych-emoji-screen-canvas");
    const clickEvent = new MouseEvent("click", {
      clientX: 100,
      clientY: 100,
      bubbles: true,
    });
    canvas.dispatchEvent(clickEvent);

    const emojiElements = canvas.querySelectorAll("span[data-emoji]");
    expect(emojiElements.length).toBe(1);
    expect(emojiElements[0].textContent).toBe("🎉");
  });

  it("places multiple emojis on multiple clicks", async () => {
    const { displayElement } = await startTimeline([
      {
        type: emojiScreen,
        emojis: ["😀"],
      },
    ]);

    const canvas = displayElement.querySelector<HTMLDivElement>("#jspsych-emoji-screen-canvas");

    for (let i = 0; i < 3; i++) {
      canvas.dispatchEvent(
        new MouseEvent("click", { clientX: 10 + i * 50, clientY: 10, bubbles: true })
      );
    }

    const emojiElements = canvas.querySelectorAll("span[data-emoji]");
    expect(emojiElements.length).toBe(3);
  });

  it("does not place the same emoji", async () => {
    const { displayElement } = await startTimeline([
      {
        type: emojiScreen,
        emojis: ["😀", "🎉"],
      },
    ]);

    const canvas = displayElement.querySelector<HTMLDivElement>("#jspsych-emoji-screen-canvas");

    for (let i = 0; i < 3; i++) {
      canvas.dispatchEvent(
        new MouseEvent("click", { clientX: 10 + i * 50, clientY: 10, bubbles: true })
      );
    }

    const emojiElements = canvas.querySelectorAll("span[data-emoji]");
    for (let i = 1; i < emojiElements.length; i++) {
      expect(emojiElements[i].textContent).not.toBe(emojiElements[i - 1].textContent);
    }
  });

  it("ends the trial when the key_to_finish key is pressed", async () => {
    const { expectFinished, getData } = await startTimeline([
      {
        type: emojiScreen,
        key_to_finish: "Enter",
      },
    ]);

    await pressKey("Enter");
    await expectFinished();

    expect(getData().values()[0].key_pressed).toBe("Enter");
  });

  it("does not end the trial when a different key is pressed", async () => {
    const { expectRunning, expectFinished } = await startTimeline([
      {
        type: emojiScreen,
        key_to_finish: "Enter",
      },
    ]);

    await pressKey("a");
    await expectRunning();

    await pressKey("Enter");
    await expectFinished();
  });

  it("records emoji_locations in the trial data", async () => {
    const { expectFinished, getData, displayElement } = await startTimeline([
      {
        type: emojiScreen,
        emojis: ["⭐"],
      },
    ]);

    const canvas = displayElement.querySelector<HTMLDivElement>("#jspsych-emoji-screen-canvas");
    canvas.dispatchEvent(
      new MouseEvent("click", { clientX: 50, clientY: 80, bubbles: true })
    );

    await pressKey("Enter");
    await expectFinished();

    const data = getData().values()[0];
    expect(Array.isArray(data.emoji_locations)).toBe(true);
    expect(data.emoji_locations.length).toBe(1);
    expect(data.emoji_locations[0].emoji).toBe("⭐");
  });

  it("records rt and key_pressed in trial data", async () => {
    const { expectFinished, getData } = await startTimeline([
      {
        type: emojiScreen,
      },
    ]);

    jest.advanceTimersByTime(1000);
    await pressKey("Enter");
    await expectFinished();

    const data = getData().values()[0];
    expect(data.rt).toBeGreaterThan(0);
    expect(data.key_pressed).toBe("Enter");
  });

  it("records an empty emoji_locations array when no clicks were made", async () => {
    const { expectFinished, getData } = await startTimeline([
      {
        type: emojiScreen,
      },
    ]);

    await pressKey("Enter");
    await expectFinished();

    const data = getData().values()[0];
    expect(data.emoji_locations).toEqual([]);
  });

  it("clears the display after the trial ends", async () => {
    const { expectFinished, getHTML } = await startTimeline([
      {
        type: emojiScreen,
      },
    ]);

    await pressKey("Enter");
    await expectFinished();

    expect(getHTML()).toBe("");
  });

  it("selects emojis only from the provided pool", async () => {
    const { displayElement } = await startTimeline([
      {
        type: emojiScreen,
        emojis: ["🍕"],
      },
    ]);

    const canvas = displayElement.querySelector<HTMLDivElement>("#jspsych-emoji-screen-canvas");

    for (let i = 0; i < 5; i++) {
      canvas.dispatchEvent(
        new MouseEvent("click", { clientX: 10 + i * 30, clientY: 50, bubbles: true })
      );
    }

    const emojiElements = canvas.querySelectorAll("span[data-emoji]");
    emojiElements.forEach((el) => {
      expect(el.textContent).toBe("🍕");
    });
  });
});
