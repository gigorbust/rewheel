import { inferBoardFromFirmwareRevision } from "@rewheel/common"
import { camelCase, toUpper } from "lodash"

export function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n)
  }
}

export const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export const typedArraysAreEqual = (a, b) => {
  if (a.byteLength !== b.byteLength) return false
  return a.every((val, i) => val === b[i])
}

export const toDisplayName = (text) =>
  text
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => {
      return str.toUpperCase()
    })
    .replace(/([A-Z])\s(?=[A-Z]\b)/g, "$1")

export const pascalCase = str => camelCase(str).replace(/^(.)/, toUpper)

export const createAndDownloadLink = (data, name) => {
  const link = document.createElement("a")

  // todo: eventually rebuild ota firmware w/ previously dumped OTA + settings sections
  const blob = new Blob([data])
  link.href = URL.createObjectURL(blob)
  link.download = name
  document.body.appendChild(link)
  link.click()
  URL.revokeObjectURL(link)
}

export const rescale = (value, fromMin, fromMax, toMin, toMax) => {
  return toMin + (((toMax - toMin) / (fromMax - fromMin)) * (value - fromMin))
}

export const preventHorizontalKeyboardNavigation = (event, callback) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
  }
  else
    callback()
}

export const inferBoardFromUpdateFile = (filename) => {
  const key = 'encryptedfw'
  const firmwareRevision = filename.substring(filename.indexOf(key) + key.length).replace('.bin', '')
  return inferBoardFromFirmwareRevision(parseInt(firmwareRevision))
}