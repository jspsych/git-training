import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

/** Represents a single placed symbol with its screen coordinates. */
interface SymbolLocation {
  x: number;
  y: number;
  symbol: string;
  mode: "emoji" | "vowel";
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
    /** The pool of vowels to randomly select from when the participant clicks. */
    vowels: {
      type: ParameterType.STRING,
      array: true,
      default: ["a", "e", "i", "o", "u"],
    },
    /** The mode of the trial. Valid values are "emoji" or "vowel". */
    mode: {
      type: ParameterType.STRING,
      default: "emoji",
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
    /** Array of objects describing each placed symbol: {x, y, symbol, mode}. x and y are pixel coordinates relative to the canvas. */
    symbol_locations: {
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
    const symbol_locations: SymbolLocation[] = [];
    const start_time = performance.now();

    // Build the trial layout using DOM APIs
    const wrapper = document.createElement("div");
    wrapper.id = "jspsych-emoji-screen-wrapper";
    wrapper.style.cssText = "position: relative; width: 100%; min-height: 400px;";

    const promptDiv = document.createElement("div");
    promptDiv.id = "jspsych-emoji-screen-prompt";

    if (trial.prompt !== null) {
      promptDiv.innerHTML = trial.prompt;
      wrapper.appendChild(promptDiv);
    }

    const canvas = document.createElement("div");
    canvas.id = "jspsych-emoji-screen-canvas";
    canvas.style.cssText =
      "position: relative; width: 100%; height: 400px; border: 2px solid #ccc; cursor: crosshair; overflow: hidden;";
    wrapper.appendChild(canvas);

    const modeButton = document.createElement("button");
    let currentMode: "emoji" | "vowel" = trial.mode as "emoji" | "vowel";
    modeButton.textContent = currentMode === "emoji" ? "Switch from Emojis to Vowels" : "Switch from Vowels to Emojis";
    modeButton.addEventListener("click", () => {
      event.stopPropagation(); // Prevent the click from placing an emoji when toggling modes
      currentMode = currentMode === "emoji" ? "vowel" : "emoji";
      modeButton.textContent = currentMode === "emoji" ? "Switch from Emojis to Vowels" : "Switch from Vowels to Emojis";
      promptDiv.innerHTML = currentMode === "emoji"
        ? "<p>Click anywhere to place emojis. Use the button to switch to vowels. Press <strong>Enter</strong> when done.</p>"
        : "<p>Click anywhere to place vowels. Use the button to switch to emojis. Press <strong>Enter</strong> when done.</p>";
    });
    wrapper.appendChild(modeButton);

    display_element.appendChild(wrapper);

    // Handle clicks on the canvas to place emojis
    canvas.addEventListener("click", (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);

      // Pick a random emoji from the pool
      let symbol;
      if (currentMode === "emoji") {
        const emoji = trial.emojis[Math.floor(Math.random() * trial.emojis.length)];
        symbol = emoji;
      } else {
        const vowel = trial.vowels[Math.floor(Math.random() * trial.vowels.length)];
        symbol = vowel;
      }

      // Place the emoji at the click location
      const emojiEl = document.createElement("span");
      emojiEl.textContent = symbol;
      emojiEl.style.position = "absolute";
      emojiEl.style.left = `${x}px`;
      emojiEl.style.top = `${y}px`;
      emojiEl.style.fontSize = "2rem";
      emojiEl.style.transform = "translate(-50%, -50%)";
      emojiEl.style.userSelect = "none";
      emojiEl.setAttribute("data-symbol", symbol);
      emojiEl.setAttribute("data-x", x.toString());
      emojiEl.setAttribute("data-y", y.toString());
      canvas.appendChild(emojiEl);

      symbol_locations.push({ x, y, symbol, mode: currentMode });
    });

    // End trial function
    const end_trial = (key: string) => {
      this.jsPsych.pluginAPI.cancelAllKeyboardResponses();

      const rt = Math.round(performance.now() - start_time);

      display_element.innerHTML = "";

      this.jsPsych.finishTrial({
        symbol_locations: symbol_locations,
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
    const simulated_locations: SymbolLocation[] = [];
    const num_symbols = this.jsPsych.randomization.sampleWithoutReplacement([1, 2, 3, 4, 5], 1)[0];
    for (let i = 0; i < num_symbols; i++) {
      const x = this.jsPsych.randomization.randomInt(0, 800);
      const y = this.jsPsych.randomization.randomInt(0, 400);
      const current_mode = this.jsPsych.randomization.sampleWithoutReplacement(["emoji", "vowel"], 1)[0] as "emoji" | "vowel";
      const symbol = current_mode === "emoji"
        ? trial.emojis[Math.floor(Math.random() * trial.emojis.length)]
        : trial.vowels[Math.floor(Math.random() * trial.vowels.length)];
      simulated_locations.push({ x, y, symbol, mode: current_mode });
    }

    const default_data = {
      symbol_locations: simulated_locations,
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
      const modeBtn = display_element.querySelector<HTMLButtonElement>("button");
      let simulatedMode = trial.mode as "emoji" | "vowel";
      for (const loc of data.symbol_locations) {
        const rect = canvas.getBoundingClientRect();
        if (loc.mode !== simulatedMode) {
          modeBtn?.click();
          simulatedMode = loc.mode;
        }
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
