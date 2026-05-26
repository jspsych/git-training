import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

const info = <const>{
  name: "button-click-counter",
  version: version,
  parameters: {
    /** The label to display on the button. */
    button_label: {
      type: ParameterType.STRING,
      default: "Click here!",
    },
    /** The key that the participant must press to end the trial. If null, any key press will end the trial. */
    key_to_advance: {
      type: ParameterType.KEY,
      default: null,
    },
    /** HTML content to display below the button and counter. Can be used to provide instructions. */
    prompt: {
      type: ParameterType.HTML_STRING,
      default: null,
    },
  },
  data: {
    /** The number of times the button was clicked during the trial. */
    button_clicks: {
      type: ParameterType.INT,
    },
    /** The key that was pressed to end the trial. */
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
 * **button-click-counter**
 *
 * A jsPsych plugin that displays a button along with a running count of how many times it has been
 * clicked. The trial ends when the participant presses a key. This plugin is useful for training
 * contributors to understand how jsPsych plugins work.
 *
 * @author jsPsych Contributors
 * @see {@link https://github.com/jspsych/git-training}
 */
class ButtonClickCounterPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    let click_count = 0;
    const start_time = performance.now();

    // Build the HTML structure using DOM APIs to avoid XSS with string parameters
    const wrapper = document.createElement("div");
    wrapper.id = "jspsych-button-click-counter-wrapper";

    const countPara = document.createElement("p");
    countPara.id = "jspsych-button-click-counter-count";
    countPara.appendChild(document.createTextNode("Button clicks: "));
    const countSpan = document.createElement("span");
    countSpan.id = "jspsych-button-click-counter-value";
    countSpan.textContent = "0";
    countPara.appendChild(countSpan);
    wrapper.appendChild(countPara);

    const btn = document.createElement("button");
    btn.id = "jspsych-button-click-counter-btn";
    btn.className = "jspsych-btn";
    btn.textContent = trial.button_label;
    wrapper.appendChild(btn);

    if (trial.prompt !== null) {
      const promptDiv = document.createElement("div");
      promptDiv.id = "jspsych-button-click-counter-prompt";
      promptDiv.innerHTML = trial.prompt;
      wrapper.appendChild(promptDiv);
    }

    display_element.appendChild(wrapper);
    btn.addEventListener("click", () => {
      click_count++;
      display_element.querySelector("#jspsych-button-click-counter-value").textContent =
        click_count.toString();
    });

    // End trial function
    const end_trial = (key: string) => {
      this.jsPsych.pluginAPI.cancelAllKeyboardResponses();

      const rt = Math.round(performance.now() - start_time);

      display_element.innerHTML = "";

      this.jsPsych.finishTrial({
        button_clicks: click_count,
        key_pressed: key,
        rt: rt,
      });
    };

    // Listen for key press
    this.jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: (info: { key: string; rt: number }) => {
        end_trial(info.key);
      },
      valid_responses: trial.key_to_advance === null ? "ALL_KEYS" : [trial.key_to_advance],
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
    const default_data = {
      button_clicks: this.jsPsych.randomization.randomInt(0, 10),
      key_pressed:
        trial.key_to_advance === null
          ? this.jsPsych.pluginAPI.getValidKey("ALL_KEYS")
          : trial.key_to_advance,
      rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
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

    // Simulate some button clicks
    const btn = display_element.querySelector<HTMLButtonElement>(
      "#jspsych-button-click-counter-btn"
    );
    for (let i = 0; i < data.button_clicks; i++) {
      this.jsPsych.pluginAPI.clickTarget(btn);
    }

    // Simulate key press to end trial
    if (data.rt !== null) {
      this.jsPsych.pluginAPI.pressKey(data.key_pressed, data.rt);
    }
  }
}

export default ButtonClickCounterPlugin;
