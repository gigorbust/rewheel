import aesjs from "aes-js"
import { fromHexString, MAX_PRE_GT_FILE_SIZE, toHashString, toHexString } from "./helpers.js"

export const KEY_HASH_ALGORITHM = "SHA-1"
const VALID_KEY_SHA_HASH = "e61dcd2fa9e689a370f6a7f81b1757cf549c94"
const VALID_GT_KEY_SHA_HASH = "75c88aa944d3508f985058a389d1ead4ffa03a1c"
const VALID_GT_IV_SHA_HASH = "14ad78f4d9805cf8fe8cf3ac97f7d59b9fb651c"

export const decryptFirmware = (firmware, key) => {
  const keyData = fromHexString(key)
  const ecb = new aesjs.ModeOfOperation.ecb(keyData)
  const buffer = new Uint8Array(firmware)
  return ecb.decrypt(buffer)
}

export const encryptFirmware = (firmware, key) => {
  const keyData = fromHexString(key)
  const ecb = new aesjs.ModeOfOperation.ecb(keyData)

  let delta = firmware.byteLength % 16
  delta = delta !== 0 ? 16 - delta : delta

  const buffer = new Uint8Array(firmware.byteLength + delta)
  buffer.set(new Uint8Array(firmware))
  buffer.fill(0xFF, firmware.byteLength)
  return ecb.encrypt(buffer)
}

export const decryptGTFirmware = (firmware, key, iv) => {
  const keyData = fromHexString(key)
  const ivData = fromHexString(iv)
  const ctr = new aesjs.ModeOfOperation.ctr(keyData, ivData)
  const buffer = new Uint8Array(firmware)
  return ctr.decrypt(buffer)
}

export const encryptGTFirmware = (firmware, key, iv) => {
  const keyData = fromHexString(key)
  const ivData = fromHexString(iv)
  const ctr = new aesjs.ModeOfOperation.ctr(keyData, ivData)

  let delta = firmware.byteLength % 16
  delta = delta !== 0 ? 16 - delta : delta

  const buffer = new Uint8Array(firmware.byteLength + delta)
  buffer.set(new Uint8Array(firmware))
  buffer.fill(0xFF, firmware.byteLength)
  return ctr.encrypt(buffer)
}

export const matchHash = async (hexString, toMatch) => {
  const hash = await toHashString(KEY_HASH_ALGORITHM, fromHexString(hexString))
  return hash === toMatch
}

export const isValidKey = async (key, gt) => {
  return await matchHash(key, gt ? VALID_GT_KEY_SHA_HASH : VALID_KEY_SHA_HASH)
}

export const isValidInitializationVector = async (iv) => {
  return await matchHash(iv, VALID_GT_IV_SHA_HASH)
}

export const extractKey = async (firmware) => {
  const uint32Size = 4
  let isGTFirmware = firmware.byteLength > MAX_PRE_GT_FILE_SIZE
  let key

  const start = 0
  const end = isGTFirmware ? 0x5000 : firmware.byteLength

  for (var i = start; i < end - 16; i += 4) {
    const view = new DataView(firmware, i, 16)
    const part1 = toHexString(view.getUint32(0))
    const part2 = toHexString(view.getUint32(uint32Size * 1))
    const part3 = toHexString(view.getUint32(uint32Size * 2))
    const part4 = toHexString(view.getUint32(uint32Size * 3))
    const potentialKey = `${part1}${part2}${part3}${part4}`.padStart(32, '0')
    const isValid = await isValidKey(potentialKey, isGTFirmware)
    if (isValid && !isGTFirmware)
      return { key: potentialKey }
    else if (isValid) {
      key = potentialKey
      break
    }
  }

  if (isGTFirmware) {
    for (var i = start; i < end - 16; i += 4) {
      const view = new DataView(firmware, i, 16)
      const part1 = toHexString(view.getUint32(0))
      const part2 = toHexString(view.getUint32(uint32Size * 1))
      const part3 = toHexString(view.getUint32(uint32Size * 2))
      const part4 = toHexString(view.getUint32(uint32Size * 3))
      const iv = `${part1}${part2}${part3}${part4}`.padStart(32, '0')
      const isValid = await isValidInitializationVector(iv)
      if (isValid)
        return { key, iv }
    }
  }

  return null
}
