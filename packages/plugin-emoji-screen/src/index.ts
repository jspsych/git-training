import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

/** Represents a single placed emoji with its screen coordinates. */
interface EmojiLocation {
  x: number;
  y: number;
  emoji: string;
}

const info = <const>{
  name: "emoji-screen",
  version: version,
  parameters: {
    /** The pool of emojis to randomly select from when the participant clicks. */
    emojis: {
      type: ParameterType.STRING,
      array: true,
      default: ["😀", "🎉", "⭐", "🌟", "🎈", "🦄", "🍕", "🎸"],
    },
    /** The key that ends the trial and records the final emoji arrangement. */
    key_to_finish: {
      type: ParameterType.KEY,
      default: "Enter",
    },
    /** HTML content to display as instructions. Shown above the canvas area. */
    prompt: {
      type: ParameterType.HTML_STRING,
      default: "<p>Click anywhere on the screen to place emojis. Press Enter when finished.</p>",
    },
  },
  data: {
    /** Array of objects describing each placed emoji: {x, y, emoji}. x and y are pixel coordinates relative to the canvas. */
    emoji_locations: {
      type: ParameterType.COMPLEX,
      array: true,
    },
    /** The key that was pressed to finish the trial. */
    key_pressed: {
      type: ParameterType.STRING,
    },
    /** The response time in milliseconds from the start of the trial until the key was pressed. */
    rt: {
      type: ParameterType.INT,
    },
  },
  // When you run build on your plugin, citations will be generated here based on the information in the CITATION.cff file.
  citations: '__CITATIONS__',
};

type Info = typeof info;

/**
 * **emoji-screen**
 *
 * A jsPsych plugin that places a random emoji wherever the participant clicks on the screen.
 * When the participant presses the finish key, the trial ends and the final arrangement of emojis
 * (including each emoji's position and character) is recorded. This plugin is useful for training
 * contributors to understand how jsPsych plugins work.
 *
 * @author jsPsych Contributors
 * @see {@link https://github.com/jspsych/git-training}
 */
class EmojiScreenPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    const emoji_locations: EmojiLocation[] = [];
    const start_time = performance.now();

    // Build the trial layout using DOM APIs
    const wrapper = document.createElement("div");
    wrapper.id = "jspsych-emoji-screen-wrapper";
    wrapper.style.cssText = "position: relative; width: 100%; min-height: 400px;";

    if (trial.prompt !== null) {
      const promptDiv = document.createElement("div");
      promptDiv.id = "jspsych-emoji-screen-prompt";
      promptDiv.innerHTML = trial.prompt;
      wrapper.appendChild(promptDiv);
    }

    const canvas = document.createElement("div");
    canvas.id = "jspsych-emoji-screen-canvas";
    canvas.style.cssText =
      "position: relative; width: 100%; height: 400px; border: 2px solid #ccc; cursor: crosshair; overflow: hidden;";
    wrapper.appendChild(canvas);

    display_element.appendChild(wrapper);

    // Handle clicks on the canvas to place emojis
    canvas.addEventListener("click", (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);

      // Pick a random emoji from the pool (different from the previous one)

      const lastEmoji = emoji_locations.at(-1)?.emoji;
      let emoji = trial.emojis[Math.floor(Math.random() * trial.emojis.length)];
      if (emoji_locations.length > 0 && emoji === lastEmoji) {
        const availableEmojis = trial.emojis.filter(e => e !== lastEmoji);
        emoji = availableEmojis.length > 0
        ? availableEmojis[Math.floor(Math.random() * availableEmojis.length)]
        : lastEmoji;
      }

      // Place the emoji at the click location
      const emojiEl = document.createElement("span");
      emojiEl.textContent = emoji;
      emojiEl.style.position = "absolute";
      emojiEl.style.left = `${x}px`;
      emojiEl.style.top = `${y}px`;
      emojiEl.style.fontSize = "2rem";
      emojiEl.style.transform = "translate(-50%, -50%)";
      emojiEl.style.userSelect = "none";
      emojiEl.setAttribute("data-emoji", emoji);
      emojiEl.setAttribute("data-x", x.toString());
      emojiEl.setAttribute("data-y", y.toString());
      canvas.appendChild(emojiEl);

      emoji_locations.push({ x, y, emoji });
    });

    // End trial function
    const end_trial = (key: string) => {
      this.jsPsych.pluginAPI.cancelAllKeyboardResponses();

      const rt = Math.round(performance.now() - start_time);

      display_element.innerHTML = "";

      this.jsPsych.finishTrial({
        emoji_locations: emoji_locations,
        key_pressed: key,
        rt: rt,
      });
    };

    // Listen for key press to finish
    this.jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: (info: { key: string; rt: number }) => {
        end_trial(info.key);
      },
      valid_responses: [trial.key_to_finish],
      rt_method: "performance",
      persist: false,
    });
  }

  simulate(
    trial: TrialType<Info>,
    simulation_mode,
    simulation_options: any,
    load_callback: () => void
  ) {
    if (simulation_mode == "data-only") {
      load_callback();
      this.simulate_data_only(trial, simulation_options);
    }
    if (simulation_mode == "visual") {
      this.simulate_visual(trial, simulation_options, load_callback);
    }
  }

  private create_simulation_data(trial: TrialType<Info>, simulation_options) {
    const num_clicks = this.jsPsych.randomization.randomInt(1, 5);
    const simulated_locations: EmojiLocation[] = [];
    for (let i = 0; i < num_clicks; i++) {
      const lastEmoji = simulated_locations.at(-1)?.emoji;
      let emoji = trial.emojis[this.jsPsych.randomization.randomInt(0, trial.emojis.length - 1)];
      if (simulated_locations.length > 0 && emoji === lastEmoji) {
        const availableEmojis = trial.emojis.filter(e => e !== lastEmoji);
        emoji = availableEmojis.length > 0
        ? availableEmojis[this.jsPsych.randomization.randomInt(0, availableEmojis.length - 1)]
        : lastEmoji;
      }
      simulated_locations.push({
        x: this.jsPsych.randomization.randomInt(0, 800),
        y: this.jsPsych.randomization.randomInt(0, 400),
        emoji: emoji,
      });
    }

    const default_data = {
      emoji_locations: simulated_locations,
      key_pressed: trial.key_to_finish,
      rt: this.jsPsych.randomization.sampleExGaussian(2000, 200, 1 / 500, true),
    };

    return this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
  }

  private simulate_data_only(trial: TrialType<Info>, simulation_options) {
    const data = this.create_simulation_data(trial, simulation_options);
    this.jsPsych.finishTrial(data);
  }

  private simulate_visual(trial: TrialType<Info>, simulation_options, load_callback: () => void) {
    const data = this.create_simulation_data(trial, simulation_options);

    const display_element = this.jsPsych.getDisplayElement();

    this.trial(display_element, trial);
    load_callback();

    // Simulate clicks to place emojis
    const canvas = display_element.querySelector<HTMLDivElement>("#jspsych-emoji-screen-canvas");
    if (canvas) {
      for (const loc of data.emoji_locations) {
        const rect = canvas.getBoundingClientRect();
        const clickEvent = new MouseEvent("click", {
          clientX: rect.left + loc.x,
          clientY: rect.top + loc.y,
          bubbles: true,
        });
        canvas.dispatchEvent(clickEvent);
      }
    }

    // Simulate key press to finish
    if (data.rt !== null) {
      this.jsPsych.pluginAPI.pressKey(data.key_pressed, data.rt);
    }
  }
}

export default EmojiScreenPlugin;
