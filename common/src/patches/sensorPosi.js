import {
  BoardGeneration
} from "../utils/board.js"
import {
  fromHexString,
  uintByteArray,
  encodeBlInstruction
} from "../utils/helpers.js"

const ADDRESSES = {
  leftFootpad: {
    5040: 0x20001bf2,
    6109: 0x20002b30
  },
  rightFootpad: {
    5040: 0x20001bf0,
    6109: 0x20002b2e
  },
  threshold: {
    5040: 0x200002a6,
    6109: 0x20000386
  },
  leftAdc: {
    5040: 0x200018fc,
    6109: 0x40012244
  },
  rightAdc: {
    5040: 0x200018f8,
    6109: 0x40012240
  },
  motorStatus: {
    5040: 0x20000020,
    6109: 0x20000022
  }
}

const appendedCode = "04000000481c0020284a2949294b7a447944126809687b441b8812680968da40d940254b25487b4478441b68f0b50468234892b289b21f788a4278441646056828bf0e4657b9228029805888132802d801305880f0bd01205f801870194878440068008890b10120174f58707f4458883f88874207d9013058805888134b7b441b8898420ad322802980e3e7104f7f443f683f88b74204d25870588026802e80d8e758780028f9d0e7e700bfce000000d0000000d2000000daffffffa80000009a000000860000007e0000006c0000004a000000f21b0020f01b0020a6020020fc180020f8180020200000201400e803"

const extraBytes = (() => {
  const bytes = fromHexString(appendedCode)
  const view = new DataView(bytes.buffer)

  return view.getUint32(0, true)
})()

export const sensorPosi = {
  priority: 3,
  description: `Convert sensor to single zone when mounting`,
  attribution: [
    "exPHAT"
  ],
  supported: [BoardGeneration.Pint, BoardGeneration.GT],
  supportsOta: true,
  experimental: true,
  confirm: true,
  extraBytes,
  args: {
    revertTime: {
      required: true,
      type: 'number',
      min: 0,
      max: 65535,
    },
//     disengageTime: {
//       required: true,
//       type: 'number',
//       min: 100,
//       max: 1000,
//     },
  },
  modifications: ({ revision, bssEnd, lastByte, revertTime, disengageTime }) => {
    revertTime = parseInt(revertTime)
    if (isNaN(revertTime))
      throw "revertTimeNotANumber"

    if (revertTime < 0 || revertTime > 65535)
      throw "revertTimeOutOfRange"

//     disengageTime = parseInt(disengageTime)
//     if (isNaN(disengageTime))
//       throw "disengageTimeNotANumber"

    const isGT = revision >= 6109

    // Location of branch patch replacement
    const patchLocation = {
      5040: 0x7a92,
      6109: 0x2daf0
    }

    return [
      { // Change full sensor lift timeout
        start: {
          5040: 0x7188,
          6109: 0x2dd28
        },
        // TODO: This needs to use disengageTime to create a `mov.w rX, #disengageTime` instruction
        // GT uses register r4, Pint uses r0
        //data: [isGT ? 0xB4 : 0xB0, 0xF5, 0x00, 0x7F]
        data: [isGT ? 0xB4 : 0xB0, 0xF5, 0xC0, 0x7F]
      },
      { // Push registers onto stack
        start: {
          5040: patchLocation[5040],
          6109: patchLocation[6109]
        },
        data: [0xFF, isGT ? 0xB5 : 0xB4]
      },
      { // Add branch to new code
        start: {
          5040: patchLocation[5040] + 2,
          6109: patchLocation[6109] + 2
        },
        data: uintByteArray(
            encodeBlInstruction(lastByte + 8, patchLocation[revision] + 8), 4, false // bl instruction to the new code
        )
      },
      { // Pop registers off the stack and NOP for Pint
        start: {
          5040: patchLocation[5040] + 6,
        },
        data: [0xFF, 0xBC, 0x00, 0xBF]
      },
      {  // Pop registers off the stack (with lr) and NOP for GT
        start: {
          6109: patchLocation[6109] + 6,
        },
        data: [0xBD, 0xE8, 0xFF, 0x40, 0x00, 0xBF, 0x00, 0xBF]
      },
      { // Append the code to the end of the firmware
        append: true,
        data: [...fromHexString(appendedCode)],
      },
      { // Update the BSS location pointer
        start: {
          5040: lastByte + 4,
          6109: lastByte + 4,
        },
        data: uintByteArray(bssEnd, 4, true),
      },
      { // Update the minimum cycles amount
        start: {
          5040: -2,
          6109: -2,
        },
        data: uintByteArray(revertTime, 2, true),
      },
      { // Update the shift value
        start: {
          5040: -4,
          6109: -4,
        },
        data: uintByteArray(isGT ? 3 : 0x14, 2, true),
      },
      { // Update the motorStatus address
        start: {
          5040: -8,
          6109: -8,
        },
        data: uintByteArray(ADDRESSES.motorStatus[revision], 4, true),
      },
      { // Update the rightAdc address
        start: {
          5040: -12,
          6109: -12,
        },
        data: uintByteArray(ADDRESSES.rightAdc[revision], 4, true),
      },
      { // Update the leftAdc address
        start: {
          5040: -16,
          6109: -16,
        },
        data: uintByteArray(ADDRESSES.leftAdc[revision], 4, true),
      },
      { // Update the threshold address
        start: {
          5040: -20,
          6109: -20,
        },
        data: uintByteArray(ADDRESSES.threshold[revision], 4, true),
      },
      { // Update the rightFootpad address
        start: {
          5040: -24,
          6109: -24,
        },
        data: uintByteArray(ADDRESSES.rightFootpad[revision], 4, true),
      },
      { // Update the leftFootpad address
        start: {
          5040: -28,
          6109: -28,
        },
        data: uintByteArray(ADDRESSES.leftFootpad[revision], 4, true),
      },
    ]
  },
}
