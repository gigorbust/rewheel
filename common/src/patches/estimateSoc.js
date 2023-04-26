import {
  allGenerations,
  BoardGeneration
} from "../utils/board.js"
import {
  fromHexString,
  uintByteArray,
  encodeBlInstruction
} from "../utils/helpers.js"

const CAPACITY_MIN_MAH = 2600
const CAPACITY_MAX_MAH = 16000

const ADDRESSES = {
  regen: {
    5040: 0x20001BD8,
    6109: 0x20002B0C
  },
  trip: {
    5040: 0x20001BD4,
    6109: 0x20002B04
  },
  voltages: {
    5040: 0x20001ABC,
    6109: 0x20002988
  },
  soc: {
    5040: 0x20001C38,
    6109: 0x20002B80
  }
}

const appendedCode = "02000000481C0020324B30B57B4418680388002B5AD0304A7A4411680A78AABB2E4C7C4425780132D4B2A54205D930F81240A34228BF2346F5E740F68B22934245D941F26702934228BF1346A3F68C239BB23222B3FBF2F0214A7A44145C02441E20434340F2DC50B3FBF0F500FB15335278121B534393FBF0F32344642BA8BF642323EAE3734B7001230B70154B4A787B4418681449154B79447B441B6809681B6809685B1A44F62061B3FBF1F364214B430F4979440988B3FBF1F35BB2D31A642BA8BF642323EAE373037030BD0023BFE700BF08010000E8FFFFFFED0000009600000080000000840000007E0000006C00000000000000010203040507080B0E101213191E21252B30353C43474C525C61640F381C0020BC1A0020D41B0020D81B0020280A"

const extraBytes = (() => {
  const bytes = fromHexString(appendedCode)
  const view = new DataView(bytes.buffer)

  return view.getUint32(0, true)
})()

export const estimateSoc = {
  priority: 3,
  description: `Estimates the state of charge via battery voltage and capacity`,
  attribution: [
    "exPHAT"
  ],
  supported: allGenerations,
  supportsOta: true,
  extraBytes,
  args: {
    batteryCapacityMah: {
      required: true,
      type: 'number',
      min: CAPACITY_MIN_MAH,
      max: CAPACITY_MAX_MAH,
    },
  },
  experimental: true,
  confirm: true,
  modifications: ({ batteryCapacityMah, revision, bssEnd, lastByte }) => {
    batteryCapacityMah = parseInt(batteryCapacityMah)
    if (isNaN(batteryCapacityMah))
      throw "notANumber"

    if (batteryCapacityMah < CAPACITY_MIN_MAH || batteryCapacityMah > CAPACITY_MAX_MAH)
      throw "outOfRange"

    let cellCount = 0
    switch (Math.floor(revision / 1000)) {
      case BoardGeneration.GT:
        cellCount = 18
        break
      case BoardGeneration.XR:
        cellCount = 15
      case BoardGeneration.Pint:
        cellCount = 15
        break
      default:
        throw "unsupportedBoard"
    }

    const patchLocation = {
      5040: 0xea24,
      6109: 0x30f48
    }

    return [
      { // Add bl instruction inside BMS message parser
        start: {
          5040: patchLocation[5040],
          6109: patchLocation[6109]
        },
        data: [...uintByteArray(encodeBlInstruction(lastByte + 8, patchLocation[revision]), 4, false), ...uintByteArray(0x1520, 2, false)],
      },
      { // Append SOC-estimation code to binary
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
      { // Overwrite battery capacity value inside the appended code
        start: {
          5040: -2,
          6109: -2,
        },
        data: uintByteArray(batteryCapacityMah, 2, true),
      },
      { // Regen address
        start: {
          5040: -6,
          6109: -6,
        },
        data: uintByteArray(ADDRESSES.regen[revision], 4, true),
      },
      { // Trip address
        start: {
          5040: -10,
          6109: -10,
        },
        data: uintByteArray(ADDRESSES.trip[revision], 4, true),
      },
      { // Voltages address
        start: {
          5040: -14,
          6109: -14,
        },
        data: uintByteArray(ADDRESSES.voltages[revision], 4, true),
      },
      { // SOC address
        start: {
          5040: -18,
          6109: -18,
        },
        data: uintByteArray(ADDRESSES.soc[revision], 4, true),
      },
      { // Cell count
        start: {
          5040: -19,
          6109: -19
        },
        data: [cellCount],
      },
    ]
  },
}
