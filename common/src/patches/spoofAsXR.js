import { BoardGeneration } from "../utils/board.js"

export const spoofAsXR = {
  attribution: [
    "exPHAT",
  ],
  priority: 3,
  supported: [BoardGeneration.Pint, BoardGeneration.GT],
  supportsOta: true,
  modifications: [
    {
      start: {
        5040: 0x9e28,
        6109: 0x206f0
      },
      data: [0x4F, 0xF4, 0x7A, 0x61, 0x80, 0xB2, 0x10, 0xEB, 0x01, 0x01]
    },
  ],
}
