# Instructions to Flash Firmware

Happily, flashing patched firmware is significantly simpler than dumping firmware from the controller.

## Before Flashing

Record your Onewheel controller ID and mileage. We'll need to patch these back into the flash memory.

To do so:

1. Solder the STM32 back to the Pint / XR. Make sure you match the original orientation of the chip denoted by the white dot on the STM32. Do continuity checks to check for shorts. Power up and verify the Onewheel still boots up. Power off the Onewheel when complete.
2. Look for a set of 8 pads on the bottom of the Pint. You'll need to clean the conformal coating off of these pins.
3. From the top of the via diagonal, connect GND, SWD IO, and SWD CLK wires respectively as shown in the picture below. You can either solder wires or just touch each of these pads with a pogo pin jig.
   ![pcb](https://user-images.githubusercontent.com/17582877/213300105-b9c85b0f-3875-4484-8797-7de8b79ab271.jpg)
4. Connect your STLinkv2 to the GND, SWD IO, and SWD CLK wires respectively.
5. Power up your Onewheel, download STM32 ST-LINK Utility and go to "Target" > "Connect".
6. Now go to Target -> Option Bytes: -> change Read-Out Protection to "Disabled".
7. Close STM32 ST-LINK Utility, open STM32CubeProgrammer, and press "Connect"
8. Run a full chip erase from the second tab on the left of CubeProgrammer. This will wipe the STM32 completely and remove Read Out Protection. **Make sure you've backed up your firmware before you do this and recorded your Onewheel ID + mileage before doing so.**
9. Go back to the first tab of CubeProgrammer and load the patched firmware file (If restoring from a brick, this will be extracted-bootloader-settings.bin). Hit Download and wait for your STM32 to be updated.
10. Hit Disconnect in CubeProgrammer
11. If restoring from a brick, you will notice your LEDs are in a blue/yellow state. Don't restart your Onewheel. Instead, go to rewheel.app, connect to your paired onewheel, download fresh base OTA, make sure you extract and save your key from extracted-bootloader-settings.bin, select your patches, downloaded patched firmware, and flash it to your Onewheel. Rewheel will say it completed and your light should go white. If it completes, and your LEDs are still blinking blue/yellow, then something went wrong and you need to restart these instructions from step 8.
12. Power cycle your Onewheel and enjoy your newly patched firmware :)
