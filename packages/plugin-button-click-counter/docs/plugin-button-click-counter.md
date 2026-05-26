# plugin-button-click-counter

A jsPsych plugin that displays a button along with a running count of how many times it has been clicked. The trial ends when the participant presses a key.

## Parameters

In addition to the [parameters available in all plugins](https://www.jspsych.org/latest/overview/plugins#parameters-available-in-all-plugins), this plugin accepts the following parameters. Parameters with a default value of undefined must be specified. Other parameters can be left unspecified if the default value is acceptable.

| Parameter      | Type       | Default Value | Description                                                                               |
| -------------- | ---------- | ------------- | ----------------------------------------------------------------------------------------- |
| button_label   | STRING     | "Click me!"   | The label to display on the button.                                                       |
| key_to_advance | KEY        | null          | The key that ends the trial. If null, any key press will end the trial.                   |
| prompt         | HTML_STRING | null         | HTML content displayed below the button. Can be used to provide instructions.             |

## Data Generated

In addition to the [default data collected by all plugins](https://www.jspsych.org/latest/overview/plugins#data-collected-by-all-plugins), this plugin collects the following data for each trial.

| Name          | Type   | Value                                                                                     |
| ------------- | ------ | ----------------------------------------------------------------------------------------- |
| button_clicks | INT    | The number of times the button was clicked during the trial.                              |
| key_pressed   | STRING | The key that was pressed to end the trial.                                                |
| rt            | INT    | The response time in milliseconds from the start of the trial until the key was pressed.  |

## Examples

### Basic use

```javascript
var trial = {
  type: jsPsychButtonClickCounter,
  button_label: "Click me!",
  prompt: "<p>Click the button, then press any key to continue.</p>"
};
```

### Require a specific key to advance

```javascript
var trial = {
  type: jsPsychButtonClickCounter,
  button_label: "Click me!",
  key_to_advance: "Enter",
  prompt: "<p>Click the button as many times as you like, then press Enter to continue.</p>"
};
```
