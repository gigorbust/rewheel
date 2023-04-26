import { fromHexString } from "../utils/helpers.js"

const patchCustomShapingForGT = "dff8bc0138443844dff85811098876b20680dff8ac01fef76ffc0020b0f9061002291fdb00211de0"

export const enableCustomShaping = {
  attribution: [
    "outlandnish",
    "exPHAT"
  ],
  priority: 0,
  supported: [5, 6, 7],
  supportsOta: true,
  experimental: true,
  modifications: [
    {
      start: {
        5040: 0xb19c,
        5046: 0xb280,
        5050: 0xb148,
        5076: 0xad54,
      },
      data: [0x05],
    },
    {
      start: {
        5040: 0xa702,
        5046: 0xa7ea,
        5050: 0xa8de,
        5076: 0x9f34,
      },
      data: [0x05],
    },
    {
      start: {
        5040: 0xb82e,
        5046: 0xb924,
        5050: 0xb7c4,
        5076: 0xb3d2,
      },
      data: [0x0a],
    },
    {
      start: {
        5040: 0x3bb2
      },
      data: [0x06]
    },
    {
      start: {
        6109: 0x21304
      },
      data: [0x07]
    },
    {
      start: {
        6109: 0x2bcca
      },
      data: [0x09]
    },
    {
      start: {
        6109: 0x2bd10
      },
      data: [0x09]
    },
    {
      start: {
        6109: 0x22366
      },
      data: [0x07]
    },
    {
      start: {
        6109: 0x2a41e
      },
      data: [0x07]
    },
    {
      start: {
        6109: 0x22a00
      },
      data: [...fromHexString(patchCustomShapingForGT)]
    }
  ],
}
