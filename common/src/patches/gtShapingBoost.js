import { BoardGeneration } from "../utils/board.js"

export const gtShapingBoost = {
  attribution: [
    "exPHAT",
  ],
  priority: 3,
  supported: [BoardGeneration.GT],
  supportsOta: true,
  experimental: true,
  modifications: [
    { // Bump up the turn compensation multiplier from -10 to -14
      start: {
        6109: 0x214c0
      },
      data: [0x0D]
    },
    { // Drop the agressiveness division from 12 to 11
      start: {
        6109: 0x215bc
      },
      data: [0x0B]
    },
    { // Bump the agressiveness-part-1 l-shift from 2 to 3 (better for multiply modifier)
      start: {
        6109: 0x215c4
      },
      data: [0xC3]
    },
    { // Bump agressiveness-part-2 l-shift from 2 to 6
      start: {
        6109: 0x215d1
      },
      data: [0x10]
    },
    { // Drop l-shift from add.w to balance out previous change
      start: {
        6109: 0x215d5
      },
      data: [0x00]
    },
  ],
}
