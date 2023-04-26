import { padNops } from "../utils/helpers.js"

export const removeBmsOOB = {
  attribution: [
    "outlandnish"
  ],
  priority: 1,
  description: "Removes Out of Band communication to the BMS that causes Error 24",
  supported: [6],
  supportsOta: true,
  modifications: [
    {
      start: {
        6109: 0x2a546,
      },
      data: padNops([], 83),
    },
    {
      start: {
        6109: 0x2bf82,
      },
      data: padNops([], 54)
    }
  ]
}