import { Box, Button, Typography } from "@mui/material"
import { Component } from "react"
import { withOnewheelSerial } from "@hooks"
import { Flasher } from "../Flasher/Flasher"
import { createAndDownloadLink } from "../../utils"
import { LinearProgressWithLabel } from "../../components/LinearProgressWithLabel"
import { withTranslation } from "react-i18next"
import { BoardGeneration } from "@rewheel/common"
import { Mutex } from "async-mutex"

const DumpState = {
  start: 0,
  flashShowWarning: 1,
  flashExtractor: 2,
  ready: 3,
  dumpBootloader: 4,
  dumpSettings: 5,
  reboot: 6,
}

const LEGACY_BOOTLOADER_START = 0x0
const LEGACY_BOOTLOADER_END = 0x3000
const LEGACY_SETTINGS_START = 0xfc00
const LEGACY_SETTINGS_END = 0xfd00
const LEGACY_BOOTLOADER_LENGTH = LEGACY_BOOTLOADER_END - LEGACY_BOOTLOADER_START
const LEGACY_SETTINGS_LENGTH = LEGACY_SETTINGS_END - LEGACY_SETTINGS_START
const GT_BOOTLOADER_START = 0x0
const GT_BOOTLOADER_END = 0xbffe
const GT_SETTINGS_START = 0x10000
const GT_SETTINGS_END = 0x1000f
const GT_BOOTLOADER_LENGTH = GT_BOOTLOADER_END - GT_BOOTLOADER_START
const GT_SETTINGS_LENGTH = GT_SETTINGS_END - GT_SETTINGS_START

const Start = ({ t, onDumpStateChanged }) => (
  <Box>
    <Typography variant="h5" sx={{ my: 2 }}>
      {t("dumper.extractor")}
    </Typography>
    <Button
      onClick={() => onDumpStateChanged(DumpState.flashShowWarning)}
      variant="outlined"
      sx={{ mx: 1 }}
    >
      {t("dumper.flashExtractor")}
    </Button>
    <Button
      onClick={() => onDumpStateChanged(DumpState.ready)}
      variant="outlined"
      sx={{ mx: 1 }}
    >
      {t("dumper.skipFlash")}
    </Button>
  </Box>
)

const FlashShowWarning = ({ t, onDumpStateChanged }) => (
  <Box>
    <Typography variant="h5">{t("warning", { ns: "common" })}</Typography>
    <Typography variant="body1" sx={{ my: 1 }}>
      {t("dumper.dumpWarning1")}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, my: 1 }}>
      {t("dumper.dumpWarning2")}
    </Typography>
    <Button
      onClick={() => onDumpStateChanged(DumpState.flashExtractor)}
      variant="contained"
      sx={{ m: 1 }}
    >
      {t("consent", { ns: "common" })}
    </Button>
  </Box>
)

const Ready = ({
  t,
  onDumpStateChanged,
  onDownload,
  downloadedBootloader,
  downloadedSettings,
}) => (
  <Box>
    <Typography variant="h5" sx={{ my: 2 }}>
      {t("dumper.extractor")}
    </Typography>
    {!downloadedBootloader && (
      <Button
        onClick={() => onDumpStateChanged(DumpState.dumpBootloader)}
        variant="outlined"
        sx={{ mx: 1 }}
      >
        {t("dumper.dumpBootloader")}
      </Button>
    )}
    {!downloadedSettings && (
      <Button
        onClick={() => onDumpStateChanged(DumpState.dumpSettings)}
        variant="outlined"
        sx={{ mx: 1 }}
      >
        {t("dumper.dumpSettings")}
      </Button>
    )}
    <Button
      onClick={() => onDumpStateChanged(DumpState.reboot)}
      variant="outlined"
      sx={{ mx: 1 }}
    >
      {t("reboot", { ns: "common" })}
    </Button>

    {(downloadedBootloader || downloadedSettings) && (
      <Button onClick={() => onDownload()} variant="contained" sx={{ mx: 1 }}>
        {t("download", { ns: "common" })}
      </Button>
    )}
  </Box>
)

const Reboot = ({ t }) => (
  <Box>
    <Typography variant="h5" sx={{ my: 2 }}>
      {t("dumper.restarted")}
    </Typography>
    <Typography variant="body1">{t("dumper.restartMessage")}</Typography>
  </Box>
)

const DumpInProgress = ({ t, progress }) => (
  <Box>
    <Typography variant="h5" sx={{ my: 2 }}>
      {t("dumper.extracting")}
    </Typography>
    <LinearProgressWithLabel value={progress} />
  </Box>
)

class StatefulDumper extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dumpState: DumpState.start,
      progress: 0,
      listening: false,
      downloadedBootloader: false,
      downloadedSettings: false,
    }

    this.partitions = this.getPartitions(this.props.generation)

    this.firmware = new Uint8Array(this.partitions.settingsEnd)
    const empty = Array(this.partitions.settingsEnd).fill(0xff)
    this.firmware.set(empty)

    this.buffer = null
    this.boundOnData = this.onDataFromOnewheel.bind(this)
    this.mutex = new Mutex()

    this.bootloaderOffset = 0
    this.settingsOffset = 0

    this.lastConfirmationIndex = 0
    this.confirmationTimeout = null
  }

  componentDidUpdate(_, prevState) {
    const { dumpState } = this.state
    if (prevState.dumpState !== dumpState) this.onDumpStateChanged()
  }

  componentWillUnmount() {
    if (this.state.listening) this.stopListening()
  }

  async onDumpStateChanged() {
    const { dumpState, listening } = this.state
    const { onewheel } = this.props
    const { serialWrite } = onewheel
    const message = new Uint8Array(1)
    const view = new DataView(message.buffer)

    switch (dumpState) {
      case DumpState.dumpBootloader:
        this.setState({
          ...this.state,
          bootloaderOffset: 0,
          progress: 0,
        })
        if (!listening) await this.startListening()
        console.log("starting bootloader dump")
        view.setUint8(0, "b".charCodeAt(0))
        await serialWrite.writeValue(message)
        break
      case DumpState.dumpSettings:
        this.setState({
          ...this.state,
          settingsOffset: 0,
          progress: 0,
        })
        if (!listening) await this.startListening()
        console.log("starting settings dump")
        view.setUint8(0, "s".charCodeAt(0))
        await serialWrite.writeValue(message)
        break
      case DumpState.reboot:
        view.setUint8(0, "r".charCodeAt(0))
        await serialWrite.writeValue(message)
        break
    }
  }

  setDumpState(dumpState) {
    this.setState({
      ...this.state,
      dumpState,
    })
  }

  async stopListening() {
    const { serialRead } = this.props.onewheel
    if (serialRead) {
      serialRead.removeEventListener(
        "characteristicvaluechanged",
        this.boundOnData
      )
      await serialRead.stopNotifications()
      this.setState({ ...this.state, listening: false })
    }
  }

  async startListening() {
    const { serialRead } = this.props.onewheel
    if (serialRead) {
      await serialRead.startNotifications()
      serialRead.addEventListener(
        "characteristicvaluechanged",
        this.boundOnData
      )
      this.setState({ ...this.state, listening: true })
    }
  }

  async updateData(value) {
    const release = await this.mutex.acquire()

    try {
      const { bootloaderOffset, settingsOffset } = this
      const { dumpState } = this.state
      const {
        bootloaderStart,
        bootloaderLength,
        settingsStart,
        settingsLength,
      } = this.partitions
      const { onewheel } = this.props
      const { serialWrite } = onewheel

      let data = new Uint8Array(value.buffer)
      let downloaded, left

      switch (dumpState) {
        case DumpState.dumpBootloader:
          left = bootloaderLength - downloaded
          downloaded = bootloaderOffset + data.byteLength
          console.log(downloaded, bootloaderLength)
          if (downloaded >= bootloaderLength) {
            console.log("last packet...truncating")
            this.firmware.set(
              data.slice(0, left),
              bootloaderStart + bootloaderOffset
            )
            downloaded = bootloaderLength
          } else {
            this.firmware.set(data, bootloaderStart + bootloaderOffset)
          }

          this.bootloaderOffset = downloaded

          this.setState({
            ...this.state,
            progress: (downloaded / bootloaderLength) * 100,
            dumpState:
              downloaded === bootloaderLength ? DumpState.ready : dumpState,
            downloadedBootloader: downloaded === bootloaderLength,
          })
          break
        case DumpState.dumpSettings:
          left = settingsLength - downloaded
          downloaded = settingsOffset + data.byteLength
          if (downloaded >= settingsLength) {
            this.firmware.set(
              data.slice(0, left),
              settingsStart + settingsOffset
            )
            downloaded = settingsLength
          } else {
            this.firmware.set(data, settingsStart + settingsOffset)
          }

          this.settingsOffset = downloaded

          this.setState({
            ...this.state,
            progress: (downloaded / settingsLength) * 100,
            dumpState:
              downloaded === settingsLength ? DumpState.ready : dumpState,
            downloadedSettings: downloaded === settingsLength,
          })
        default:
          break
      }

      const sendConfirmation = async () => {
        this.lastConfirmationIndex = downloaded
        // Acknowledge the data and ask for next
        const message = new Uint8Array(1)
        const view = new DataView(message.buffer)
        view.setUint8(0, "n".charCodeAt(0))

        await serialWrite.writeValue(message)
      }

      if (downloaded - this.lastConfirmationIndex >= 20) { // Frame size
        clearTimeout(this.confirmationTimeout)
        await sendConfirmation()
      } else {
        this.confirmationTimeout = setTimeout(sendConfirmation, 1000)
      }
    } finally {
      release()
    }
  }

  async onDataFromOnewheel(event) {
    this.updateData(event.target.value)
  }

  download() {
    const { device } = this.props.onewheel

    let namePrefix = `${device?.name}-`

    const bootloaderSuffix = this.state.downloadedBootloader
      ? "-bootloader"
      : ""
    const settingsSuffix = this.state.downloadedSettings ? "-settings" : ""
    createAndDownloadLink(
      this.firmware,
      `${namePrefix}extracted${bootloaderSuffix}${settingsSuffix}.bin`
    )
  }

  render() {
    const { t, onewheel } = this.props
    const { supported, error: connectionError } = onewheel
    const {
      dumpState,
      progress,
      error,
      downloadedBootloader,
      downloadedSettings,
    } = this.state

    if (!supported) return <NotSupported />

    switch (dumpState) {
      case DumpState.start:
        return (
          <Start
            t={t}
            onDumpStateChanged={(state) => this.setDumpState(state)}
          />
        )
      case DumpState.flashShowWarning:
        return (
          <FlashShowWarning
            t={t}
            onDumpStateChanged={(state) => this.setDumpState(state)}
          />
        )
      case DumpState.flashExtractor:
        return (
          <Flasher
            t={t}
            firmware={this.props.firmware}
            onComplete={() => this.setDumpState(DumpState.ready)}
            suppressWarning={true}
          />
        )
      case DumpState.ready:
        return (
          <Ready
            t={t}
            onDumpStateChanged={(state) => this.setDumpState(state)}
            onDownload={() => this.download()}
            downloadedBootloader={downloadedBootloader}
            downloadedSettings={downloadedSettings}
          />
        )
      case DumpState.dumpBootloader:
      case DumpState.dumpSettings:
        return <DumpInProgress t={t} progress={progress} />
      case DumpState.reboot:
        return <Reboot t={t} />
      default:
        return <></>
    }
  }

  getPartitions(generation) {
    let bootloaderStart,
      bootloaderEnd,
      bootloaderLength,
      settingsStart,
      settingsEnd,
      settingsLength
    switch (generation) {
      case BoardGeneration.GT:
        bootloaderStart = GT_BOOTLOADER_START
        bootloaderEnd = GT_BOOTLOADER_END
        bootloaderLength = GT_BOOTLOADER_LENGTH
        settingsStart = GT_SETTINGS_START
        settingsEnd = GT_SETTINGS_END
        settingsLength = GT_SETTINGS_LENGTH
        break
      default:
        bootloaderStart = LEGACY_BOOTLOADER_START
        bootloaderEnd = LEGACY_BOOTLOADER_END
        bootloaderLength = LEGACY_BOOTLOADER_LENGTH
        settingsStart = LEGACY_SETTINGS_START
        settingsEnd = LEGACY_SETTINGS_END
        settingsLength = LEGACY_SETTINGS_LENGTH
    }

    return {
      bootloaderStart,
      bootloaderEnd,
      bootloaderLength,
      settingsStart,
      settingsEnd,
      settingsLength,
    }
  }
}

export const Dumper = (props) =>
  withOnewheelSerial(withTranslation(["backup", "common"])(StatefulDumper))(
    props
  )
