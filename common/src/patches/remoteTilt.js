import {
  BoardGeneration
} from "../utils/board.js"
import {
  fromHexString,
  uintByteArray,
  encodeBlInstruction
} from "../utils/helpers.js"

const ADDRESSES = {
  calibration: {
    // Amazingly these two are the same
    5040: 0x20000048,
    6109: 0x20000048
  },
  angleInput: {
    5040: 0x200000c0,
    6109: 0x200001b0
  },
  angleOutput: {
    5040: 0x2000002a,
    6109: 0x2000002c
  },
  carveInput: {
    5040: 0x200000c2,
    6109: 0x200001b2
  },
  carveOutput: {
    5040: 0x20001c16,
    6109: 0x20002b5a
  },
}

const appendedCode = "00000000481C00200E4B7B441B681B88DA0713D50C4AC3EB03137A445B00A3F5E64312687E3B1380084B7B441A68084B7B441B681B88584310807047054A7A441268F0E74E0000003A0000003A000000300000001E00000048000020C00000202A000020C2000020161C0020"

const extraBytes = (() => {
  const bytes = fromHexString(appendedCode)
  const view = new DataView(bytes.buffer)

  return view.getUint32(0, true)
})()

export const remoteTilt = {
  priority: 3,
  description: `Convert custom shaping tilt into live remote tilt`,
  attribution: [
    "exPHAT"
  ],
  supported: [BoardGeneration.Pint, BoardGeneration.GT],
  supportsOta: true,
  extraBytes,
  experimental: true,
  modifications: ({ revision, bssEnd, lastByte }) => {

    const patchLocation = {
      5040: 0xa984,
      6109: 0x21582
    }

    return [
      {
        start: {
          5040: patchLocation[5040],
        },
        data: [
          0xB3, 0xF8, 0x02, 0xC0, 0x0F, 0xB4, // Push used registers onto the stack, move ldrh.w up one instruction
          0x38, 0x46,
          ...uintByteArray(
            encodeBlInstruction(lastByte + 8, patchLocation[revision] + 8), 4, false // bl instruction to the new code
          ),
          0x0F, 0xBC // Pop used registers off the stack
        ]
      },
      {
        start: {
          6109: patchLocation[6109],
        },
        data: [
          0xFF, 0xB4, 0x60, 0x46,
          ...uintByteArray(
            encodeBlInstruction(lastByte + 8, patchLocation[revision] + 4), 4, false // bl instruction to the new code
          ),
          0xFF, 0xBC,
          0x00, 0xBF, // nop
          0xB3, 0xF8, 0x00, 0xe0

        ]
      },
      { // Unlock speed limits
        start: {
          5040: 0xb1aa,
          6109: 0x22374
        },
        data: [0xFE, 0x6F]
      },
      {
        start: {
          5040: 0xb31c,
          6109: 0x229fe
        },
        data: [0x00, 0xBF]
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
      { // Update the carveOutput address
        start: {
          5040: -4,
          6109: -4,
        },
        data: uintByteArray(ADDRESSES.carveOutput[revision], 4, true),
      },
      { // Update the carveInput address
        start: {
          5040: -8,
          6109: -8,
        },
        data: uintByteArray(ADDRESSES.carveInput[revision], 4, true),
      },
      { // Update the angleOutput address
        start: {
          5040: -12,
          6109: -12,
        },
        data: uintByteArray(ADDRESSES.angleOutput[revision], 4, true),
      },
      { // Update the angleInput address
        start: {
          5040: -16,
          6109: -16,
        },
        data: uintByteArray(ADDRESSES.angleInput[revision], 4, true),
      },
      { // Update the calibration address
        start: {
          5040: -20,
          6109: -20,
        },
        data: uintByteArray(ADDRESSES.calibration[revision], 4, true),
      },
    ]
  },
}
