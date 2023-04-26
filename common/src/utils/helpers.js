export const nop = [0x00, 0xbf]

export const PRE_GT_OTA_LENGTH = 0xfd00
export const PRE_GT_APP_OFFSET = 0x3000
export const GT_OTA_LENGTH = 0x5ffff
export const GT_APP_OFFSET = 0x20000

export const MAX_PRE_GT_FILE_SIZE = 64 * 1024
export const GT_FFU_THRESHOLD = 100 * 1024

export const BSS_LOCATIONS = {
  5040: 0xf2b8,
  6109: 0x31d5c,
}

export const BSS_END_ADDRESSES = {
  5040: 0x200002b0 + 0x1998,
  6109: 0x20000394 + 0x2800,
}

export const padNops = (data, count) =>
  count == 0 ? data : padNops(data.concat(nop), count - 1)

export const printArgs = (args) => {
  for (const arg of Object.keys(args))
    console.debug(` - \x1b[33m${arg}\x1b[0m: ${args[arg]}`)
}

export const fromHexString = (hexString) => {
  const bytes = hexString.match(/.{1,2}/g)
  if (!bytes) return null
  // eslint-disable-next-line no-undef
  return Uint8Array.from(bytes.map((byte) => parseInt(byte, 16)))
}

export const toHexString = (number) => {
  return number.toString(16)
}

export const toHashString = async (algorithm, data) => {
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  let asArray = new Uint8Array(hashBuffer)
  asArray = [...asArray]
  return asArray.map((c) => toHexString(c)).join("")
}

export const uintByteArray = (value, length, littleEndian) => {
  const buffer = new Uint8Array(length)
  const view = new DataView(buffer.buffer)

  switch (length) {
    case 1:
      view.setUint8(0, value, littleEndian)
      break
    case 2:
      view.setUint16(0, value, littleEndian)
      break
    case 4:
      view.setUint32(0, value, littleEndian)
      break
    default:
      throw new Error("Invalid length")
  }

  return Array.from(buffer)
}

// Swap bytes 1 and 2 with eachother, and bytes 3 and 4 with eachother
export const convertInstructionWordsEndianess = (instruction) => {
  const bytes = new Uint8Array(4)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, instruction, false)
  const swappedBytes = new Uint8Array(4)
  swappedBytes[0] = bytes[1]
  swappedBytes[1] = bytes[0]
  swappedBytes[2] = bytes[3]
  swappedBytes[3] = bytes[2]
  return new DataView(swappedBytes.buffer).getUint32(0, false)
}

export const encodeBlInstruction = (target, pc) => {
  const imm32 = target - 4 - pc

  const s = (imm32 >> 24) & 1
  const i1 = (imm32 >> 23) & 1
  const i2 = (imm32 >> 22) & 1
  const imm10 = (imm32 >> 12) & 0x3ff
  const imm11 = (imm32 >> 1) & 0x7ff

  const j1 = i1 ^ s ? 0 : 1
  const j2 = i2 ^ s ? 0 : 1

  const instruction =
    0xf000d000 + (s << 26) + (imm10 << 16) + (j1 << 13) + (j2 << 11) + imm11

  return convertInstructionWordsEndianess(instruction)
}

export const extractBits = (value, start, length) => {
  return ((1 << length) - 1) & (value >> (start - 1))
}

export const encodeThumbMovWInstruction = (register, value) => {
  const imm4 = (value >> 12) & 0xf
  const i = (value >> 11) & 1
  const imm3 = (value >> 8) & 0x7
  const imm8 = value & 0xff

  const instruction =
    0xf2400000 +
    (i << 26) +
    (imm4 << 16) +
    (imm3 << 12) +
    (register << 8) +
    imm8

  return convertInstructionWordsEndianess(instruction)
}
