import fs from "fs"
import { exit, argv } from "process"
import {
  patches,
  checksumForFirmware,
  matchFirmwareRevision,
  applyPatch,
  getMissingArgs,
} from "@rewheel/common"
import * as minimist from "minimist"

const args = minimist.default(argv.slice(2))
console.log("\x1b[1mOneWheel Firmware Patcher\x1b[0m")

const printUsage = () => {
  console.log(
    "\x1b[1mUsage: yarn patcher -i [input file] -o [output file] [...patches] --[patch args]\x1b[0m"
  )
  console.log("\x1b[1mUsage: yarn patcher -i [input file] --checksum\x1b[0m")
  console.log("\nAvailable Patches:")

  // list out all available patches
  for (const patchName of Object.keys(patches)) {
    const patch = patches[patchName]
    console.log(`\x1b[32m  ${patchName}\x1b[0m - ${patch.description}`)
    const args = patch.arguments

    // list out args
    if (args) {
      for (const arg of Object.keys(args))
        console.log(
          `   - \x1b[33m${arg}\x1b[0m:${
            args[arg].required ? "" : " \x1b[2m(optional)\x1b[0m"
          } ${args[arg].description}`
        )
    }
  }
  console.log("")
}

if (args.help || !args.i || args.input) {
  printUsage()
  exit(0)
}

const inputFile = args.i || args.input
const extension = inputFile.lastIndexOf(".")
const pathParts = [
  inputFile.substring(0, extension),
  inputFile.substring(extension),
]
const outputPath = args.o || args.output || `${pathParts[0]}-patched.bin`
const requestedOperations = args._.filter(
  (operation) => patches[operation] !== undefined
)

if (requestedOperations.length == 0 && !args.checksum) {
  console.warn("no valid patches applied")
  exit(0)
}

try {
  let firmware = fs.readFileSync(inputFile).buffer.slice(0)
  const { checksum, _ota } = checksumForFirmware(firmware)
  const firmwareRevision = matchFirmwareRevision(checksum)
  console.log("firmware checksum\x1b[33m", checksum, "\x1b[0m")

  if (firmwareRevision === undefined)
    throw `firmware doesn't match a known revision`

  console.log("firmware match:", firmwareRevision)

  if (args.checksum) exit(0)

  let appliedPatches = 0
  requestedOperations.forEach((operation, index) => {
    try {
      const patch = patches[operation]

      // look for required args for patch
      const missingArgs = getMissingArgs(args, patch)
      if (missingArgs.length > 0)
        throw `missing required args \x1b[33m${missingArgs.join(",")}\x1b[37m`

      // apply patch
      console.log(
        `applying patch (${index + 1}/${
          requestedOperations.length
        }) - \x1b[32m${operation}\x1b[37m`
      )
      const { firmware: patchedFirmware, applied } = applyPatch(
        firmware,
        firmwareRevision,
        patch,
        args
      )

      if (applied) {
        appliedPatches++
        firmware = patchedFirmware
      } else {
        console.warn("skipped patch", operation)
      }
    } catch (err) {
      console.error(
        `\x1b[31merror applying patch (${index + 1}/${
          requestedOperations.length
        }) - \x1b[32m${operation}\x1b[37m: ${err}\x1b[0m`
      )
    }
  })

  if (appliedPatches > 0) {
    fs.writeFileSync(outputPath, new Uint8Array(firmware))
    console.log(
      "\x1b[1mcomplete. patched binary saved as",
      outputPath,
      "\x1b[0m"
    )
  } else {
    console.warn("\x1b[33mno valid patches applied\x1b[0m")
  }
} catch (err) {
  console.error(`\x1b[31m${err}\x1b[0m`)
  exit(-1)
}
