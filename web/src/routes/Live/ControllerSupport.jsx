let gamepads = navigator.getGamepads();

if (gamepad[0].mapping == "standard") {
    console.log("Controller has standard mapping");
} else {
    console.log("Controller does not have standard mapping");
}

  export function handleGamepadInput(gamepad) {
    // your gamepad logic here
  }

  export function updateSliderValue(gamepad) {
    const slider = document.getElementById("slider");
    const sliderValue = Math.round((gamepad.axes[0] + 1) * 50);
    slider.value = sliderValue;
  }
  