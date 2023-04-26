import { useEffect, useState } from "react"
import {
  checksumForFirmware,
  decryptFirmware,
  matchFirmwareRevision,
} from "@rewheel/common"
import { useFirmwareLoader } from "@hooks"
import DecryptFirmware from "./DecryptFirmware"
import NoFirmwareMatch from "./NoFirmwareMatch"
import NotStarted from "./NotStarted"
import Patcher from "./Patcher"
import localforage from "localforage"
import { decryptGTFirmware } from "@rewheel/common/src/utils/encryption"

const PatcherState = {
  notStarted: 0,
  noFirmwareMatch: 1,
  decrypt: 2,
  patching: 3,
}

const defaultMetadata = {
  name: null,
  checksum: null,
  revision: null,
  gt: null,
  ota: null,
}

const PatcherPage = () => {
  const [patcherState, setPatcherState] = useState(PatcherState.notStarted)
  const [metadata, setMetadata] = useState(defaultMetadata)
  const { file, firmware, clearFirmware, showFirmwareInput } =
    useFirmwareLoader()
  const [decrypted, setDecrypted] = useState(null)
  const [key, setKey] = useState(null)

  const reset = () => {
    clearFirmware()
    setPatcherState(PatcherState.notStarted)
  }

  const onGetMetadata = async () => {
    const { revision, ota, gt } = metadata
    if (revision === undefined) setPatcherState(PatcherState.noFirmwareMatch)
    else if (ota) {
      const keyMissing = gt
        ? key?.key === null || key?.iv === null
        : key?.key === null
      console.log(key)
      if (!keyMissing)
        setDecrypted(
          gt
            ? decryptGTFirmware(firmware, key.key, key.iv)
            : decryptFirmware(firmware, key.key)
        )
      setPatcherState(keyMissing ? PatcherState.decrypt : PatcherState.patching)
    } else {
      setPatcherState(PatcherState.patching)
    }
  }

  const checkFirmwareRevision = async () => {
    const { checksum, ota, gt } = checksumForFirmware(firmware)
    const revision = matchFirmwareRevision(checksum)

    const key = await localforage.getItem(
      gt ? "decryption-key-gt" : "decryption-key"
    )
    const iv = gt ? await localforage.getItem("decryption-iv-gt") : null
    setKey({ key, iv })
    setMetadata({ name: file.name, checksum, revision, ota, gt })
  }

  useEffect(() => {
    if (!firmware) {
      setMetadata(defaultMetadata)
      return
    }

    checkFirmwareRevision()
  }, [firmware])

  useEffect(() => {
    if (!metadata.checksum) return
    onGetMetadata()
  }, [metadata])

  const { checksum } = metadata

  let step
  switch (patcherState) {
    case PatcherState.notStarted:
      step = <NotStarted showFirmwareInput={showFirmwareInput} />
      break
    case PatcherState.noFirmwareMatch:
      step = <NoFirmwareMatch reset={reset} checksum={checksum} />
      break
    case PatcherState.decrypt:
      step = <DecryptFirmware reset={reset} />
      break
    case PatcherState.patching:
      step = (
        <Patcher
          firmware={firmware}
          metadata={metadata}
          reset={reset}
          decrypted={decrypted}
          encryptionKey={key}
        />
      )
      break
    default:
      setPatcherState(PatcherState.notStarted)
      break
  }

  return step
}

export default PatcherPage
