# plugin-emoji-screen

A jsPsych plugin that places a random emoji wherever the participant clicks on the screen and records the final arrangement of all placed emojis.

## Parameters

In addition to the [parameters available in all plugins](https://www.jspsych.org/latest/overview/plugins#parameters-available-in-all-plugins), this plugin accepts the following parameters. Parameters with a default value of undefined must be specified. Other parameters can be left unspecified if the default value is acceptable.

| Parameter     | Type        | Default Value                                        | Description                                                            |
| ------------- | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| emojis        | STRING[]    | ["😀","🎉","⭐","🌟","🎈","🦄","🍕","🎸"]         | The pool of emojis to randomly select from when the participant clicks.|
| key_to_finish | KEY         | "Enter"                                              | The key that ends the trial and records the final arrangement.         |
| prompt        | HTML_STRING | "(default instructions)"                             | HTML content displayed above the canvas. Can be used for instructions. |

## Data Generated

In addition to the [default data collected by all plugins](https://www.jspsych.org/latest/overview/plugins#data-collected-by-all-plugins), this plugin collects the following data for each trial.

| Name            | Type    | Value                                                                                        |
| --------------- | ------- | -------------------------------------------------------------------------------------------- |
| emoji_locations | COMPLEX | Array of objects `{x, y, emoji}` describing each placed emoji and its pixel coordinates.     |
| key_pressed     | STRING  | The key that was pressed to finish the trial.                                                |
| rt              | INT     | The response time in milliseconds from the start of the trial until the key was pressed.     |

## Examples

### Basic use

```javascript
var trial = {
  type: jsPsychEmojiScreen,
  emojis: ["😀", "🎉", "⭐", "🌟"],
  key_to_finish: "Enter",
  prompt: "<p>Click to place emojis, then press Enter when done.</p>"
};
```

### Custom emoji pool

```javascript
var trial = {
  type: jsPsychEmojiScreen,
  emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊"],
  key_to_finish: "Enter",
  prompt: "<p>Click to scatter animals across the screen, then press Enter.</p>"
};
```
