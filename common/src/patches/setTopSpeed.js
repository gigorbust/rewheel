import { allGenerations, BoardGeneration, inferBoardFromFirmwareRevision } from "../utils/board.js"
import { encodeThumbMovWInstruction } from "../utils/helpers.js"

export const setTopSpeed = {
  attribution: [
    "outlandnish",
    "exPHAT"
  ],
  priority: 1,
  description: `Sets the top speed before pushback`,
  supported: allGenerations,
  supportsOta: true,
  args: {
    topSpeed: {
      required: true,
      type: 'number',
      min: 900,
      max: 2500
    },
  },
  experimental: false,
  confirm: true,
  modifications: ({ topSpeed, revision }) => {
    const generation = inferBoardFromFirmwareRevision(revision)
    console.log(revision, generation)

    topSpeed = parseInt(topSpeed)
    if (isNaN(topSpeed))
      throw "notANumber"

    if (topSpeed < 900 || topSpeed > 2500)
      throw "outOfRange"

    let buffer = new Uint8Array(0)
    let buffer2 = new Uint8Array(0)
    let buffer3 = new Uint8Array(0)

    if (BoardGeneration[generation] !== BoardGeneration.GT) {
      if (topSpeed > 2000)
        throw "outOfRange"

      buffer = new Uint8Array(2)
      buffer2 = new Uint8Array(2)
      const view = new DataView(buffer.buffer)
      const view2 = new DataView(buffer2.buffer)
      view.setUint16(0, topSpeed, true)

      const register = revision === 5076 ? 0x0a : 6
      view.setUint8(1, (view.getUint8(1) << 4) + register)

      view2.setUint16(0, topSpeed, true)
      view2.setUint8(1, view.getUint8(1) << 4)
    }
    else {
      buffer = new Uint8Array(4)
      const view = new DataView(buffer.buffer)
      view.setUint32(0, encodeThumbMovWInstruction(3, topSpeed))

      buffer2 = new Uint8Array(4)
      const view2 = new DataView(buffer2.buffer)
      view2.setUint32(0, encodeThumbMovWInstruction(1, topSpeed))

      buffer3 = new Uint8Array(4)
      const view3 = new DataView(buffer3.buffer)
      view3.setUint32(0, encodeThumbMovWInstruction(0, topSpeed))
    }

    return [
      {
        start: {
          5040: 0xa8c4,
          5076: 0xa0d8
        },
        data: Array.from(buffer),
      },
      {
        start: {
          5040: 0xa8c8,
          5076: 0xa0dc
        },
        data: Array.from(buffer),
      },
      {
        start: {
          5040: 0xaa1e,
          5076: 0xa21a
        },
        data: Array.from(buffer2),
      },
      {
        start: {
          5040: 0xaa22,
          5076: 0xa21e
        },
        data: Array.from(buffer2),
      },
      {
        start: {
          6109: 0x214c2,
        },
        data: Array.from(buffer)
      },
      {
        start: {
          6109: 0x21414,
        },
        data: Array.from(buffer2)
      },
      {
        start: {
          6109: 0x21600,
        },
        data: Array.from(buffer3)
      }
    ]
  },
}
