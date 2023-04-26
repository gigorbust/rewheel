# How to make reverse engineer the Onewheel firmware

There are two types of patches in Rewheel:

1. Modifying / removing existing code to have different behavior
2. Adding new code to add new behavior to the firmware

This guide will primarily focus on the first option. There will be future info on how to do the second part (which relies on the first part anyway).

## Pre-requisites

You will need the following software:

- [Ghidra](https://github.com/NationalSecurityAgency/ghidra) (10.2.3 is the latest as of writing this document)
- [SVD-Loader](https://github.com/h2lab/SVD-Loader)
- The appropriate SVD file for your chip
  - `STM32F103.svd` for anything pre-GT
  - `STM32F415.svd` for GT

In addition, you will want to wire up an ST-Link to your board so that you can recover it when your patches (inevitably) crash the board while testing. It's also much easier / quicker to reflash the board this way instead of relying on an OTA update.

It also doesn't hurt to have the datasheet for the STM32F103 and the STM32F415 on hand if you're interacting with any of the peripherals (e.g. you should know which pins the board uses to connect to the footpad sensors if you're modifying footpad sensitivity).

## Setup

1. You will need to install the SVD-Loader plugin into Ghidra. Here's a good example video of how to do it: https://www.youtube.com/watch?v=J25HxGlBvSE
2. If you're using an OTA file, you'll need to first decrypt it. If you're using a physical dump, you can ignore this step.

For pre-GT:
`openssl enc -d -aes-128-ecb -nosalt -nopad -K <encryption key> -in <encrypted file path>.bin -out <decrypted file path.bin>`

For GT:
`openssl enc -d -aes-128-ctr -nopad -K <encryption key> -iv <encryption initialization vector> -in <encrypted file path>.bin -out <decrypted file path.bin>`

3. Load your firmware into it from `File > Import File`
4. Set the language as ARM / Cortex / 32 / Little Endian
5. Under options, you will setup different settings based on what file you're using.

- Block name can be anything - I usually name it `app`
- For pre-GT, the base address is `0x08000000` for full dumps and `0x08003000` for OTA files
- For GT, the base address is `0x08000000` for full dumps and `0x08020000` for OTA files
- Leave all other options alone and hit OK for both dialogs. Close the summary window that pops up.

6. Double click on the file you just loaded and a new window will open. Say no when it asks you if you want to analyze the file now.
7. Go to `Window > Script Manager` and select the SVD Loader script. Use that to load the appropriate SVD file for your chip (listed above).
8. Go to `Window > Memory Map`.

- Uncheck the `W` column for the `app` section you created.
- Add a new section using the `+` icon.
- For pre-GT, add a section called SRAM that starts at `0x20000000` and is `0x5000` bytes long.
- For GTs, add a section called SRAM that starts at `0x20000000` and is `0x20000` bytes long.
- Close out of the memory map

9. Attach the appropriate Function ID Database. This pre-populates the names of functions that we've come up with as we've done reverse engineering. It might not all be accurate, but it's a good leg up from starting from scratch.

- `Tools > Function ID > Attach Existing FidDB`. Navigate to the apppropriate file for your board in the `Function ID DB` directory of this project.

10. `Analyze > Auto Analyze...`. Keep the options pre-selected and add the following

- Check `ARM Aggressive Instruction Finder (Prototype)`. Use the default options.
- Check `Decompile Parameter ID`
- Under `Function ID`, check `Always apply FID Labels`
- Check `Scalar Operand References`
- Hit analyze.

You're done! You've now setup your firmware for reverse engineering. If successful, you should see a list of pre-named functions show up in the Functions folder on the left.

There's tons of great resources on reverse engineering. Don't hesitate to reach out on the Rewheel Discord.
