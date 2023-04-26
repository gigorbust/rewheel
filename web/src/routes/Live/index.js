export { RideBehavior } from "./RideBehavior"
export { LivePage } from "./LivePage"
export { BatteryInfo } from "./BatteryInfo"
export { FactoryMode } from "./FactoryMode"

// Initialize Gamepad.js
const gamepad = new Gamepad();
gamepad.init();

// Set up event listeners for gamepad input
gamepad.bind(Gamepad.Event.BUTTON_DOWN, function(e) {
  // Handle button press
});

gamepad.bind(Gamepad.Event.BUTTON_UP, function(e) {
  // Handle button release
});

gamepad.bind(Gamepad.Event.AXIS_CHANGED, function(e) {
  // Map joystick input to slider position
const slider = document.querySelector('.range-slider__range');
const value = parseInt(slider.value);
const max = parseInt(slider.max);
const min = parseInt(slider.min);
const step = parseInt(slider.step);
const threshold = 0.5;

if (e.axis === Gamepad.Axis.LEFT_STICK_Y) {
  // Handle vertical joystick movement
  if (e.value < -threshold) {
    // Move slider up
    slider.value = Math.max(min, value - step);
  } else if (e.value > threshold) {
    // Move slider down
    slider.value = Math.min(max, value + step);
  }
}

// Update slider position
slider.dispatchEvent(new Event('input', { bubbles: true }));
slider.dispatchEvent(new Event('change', { bubbles: true }));

});
