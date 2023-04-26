import { BSS_LOCATIONS } from "@rewheel/common/src/utils/helpers"

export const applyPatch = (firmware, revision, patch, lastByteIndex, bssEndIndex, isGT, args) => {
  let modifications = []
  let addedFirmwareLength = 0

  if (typeof patch.modifications === "function") {
    modifications = patch.modifications({ ...args, revision, bssEnd: bssEndIndex, lastByte: lastByteIndex })
  } else modifications = patch.modifications

  let view = new DataView(firmware)

  let applied = false
  for (const mod of modifications) {
    if (mod.append) {
      console.log('firmware length', firmware.byteLength)
      console.log(`appending modification to firmware: ${mod.data.length} bytes`, `new firmware length`, firmware.byteLength)

      for (let offset = 0; offset < mod.data.length; offset++) {

        view.setUint8(offset + lastByteIndex, mod.data[offset])
      }

      addedFirmwareLength += mod.data.length
      applied = true
    } else if (typeof mod.transform === "function") {
      const currentFirmwareLength = firmware.byteLength
      firmware = mod.transform(firmware, { ...args, revision })
      addedFirmwareLength += firmware.byteLength - currentFirmwareLength
      applied = true
    } else {
      let start
      if (typeof mod.start === "function") start = mod.start(revision)
      else if (!mod.start[revision]) {
        console.warn(`skipping modification for ${revision}`)
        continue
      } else start = mod.start[revision]

      if (start < 0) {
        start = lastByteIndex + addedFirmwareLength + start
      }

      for (let i = 0; i < mod.data.length; i++) {
        view.setUint8(start + i, mod.data[i])
      }

      applied = true
    }
  }

  let addedBssLength = 0

  if (patch.extraBytes) {
    const currentBss = view.getUint32(BSS_LOCATIONS[revision], true)
    view.setUint32(BSS_LOCATIONS[revision], currentBss + patch.extraBytes, true)
    addedBssLength = patch.extraBytes
  }

  const delta = addedFirmwareLength % 16;
  if (delta > 0) {
    addedFirmwareLength += 16 - delta;

    // Maybe forcefully write 0xFF's to the end of the firmware here?
  }

  return { firmware, applied, addedFirmwareLength, addedBssLength }
}

export const getMissingArgs = (args, patch) => {
  if (!patch.args) return []

  const missingArgs = []
  for (const arg of Object.keys(patch.args)) {
    if (!args[arg] && patch.args[arg].required) missingArgs.push(arg)
  }

  return missingArgs
}
