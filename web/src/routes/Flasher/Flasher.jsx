import PropTypes from "prop-types"
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material"
import {
  matchFirmwareRevision,
  checksumForFirmware,
  fromHexString,
  inferBoardFromFirmwareRevision,
  inferBoardFromHardwareRevision,
} from "@rewheel/common"
import { chunks, sleep, typedArraysAreEqual } from "../../utils"
import { Component } from "react"
import { withOnewheelSerial } from "@hooks"
import {
  HEADER_MESSAGE,
  START_UPDATE_MESSAGE,
  UPDATE_FAIL_CORRUPT,
  UPDATE_FAIL_FILE_SIZE,
  UPDATE_FAIL_TIMEOUT,
  UPDATE_READY_TO_START,
} from "../../messages"
import { NotSupported } from "../../components/ConnectionManager"
import { LinearProgressWithLabel } from "../../components/LinearProgressWithLabel"
import { useState } from "react"
import { Trans, withTranslation } from "react-i18next"

export const FlashState = {
  notStarted: 0,
  showWarning: 1,
  inProgress: 2,
  failed: 3,
  complete: 4,
}

export const UpdateState = {
  ready: 0,
  failCorrupt: 1,
  failFileSize: 2,
  failTimeout: 3,
}

const OTA_TIMEOUT = 5000

const UpdateError = ({ t, error, retry }) => (
  <Box>
    <Typography variant="h5" sx={{ my: 2 }}>
      {t("updateError")}
    </Typography>
    <Typography variant="body">{error}</Typography>
    <Button onClick={() => retry()} variant="contained">
      {t("retryUpdate")}
    </Button>
  </Box>
)

const UpdateInProgress = ({ t, progress }) => (
  <Box>
    <Typography variant="h5" sx={{ my: 2 }}>
      {t("updating")}
    </Typography>
    <LinearProgressWithLabel value={progress} />
  </Box>
)

const UpdateComplete = ({ t, onComplete }) => (
  <Box>
    <Typography variant="h5">{t("updateComplete.title")}</Typography>
    <Typography variant="body1">{t("updateComplete.message1")}</Typography>
    <Typography variant="body2">
      <Trans t={t} i18nKey="updateComplete.message2">
        x<a href="https://www.youtube.com/watch?v=7vE0SrLPtLk"></a>
      </Trans>
    </Typography>
    {onComplete && <Button onClick={() => onComplete()}></Button>}
  </Box>
)

const NotStarted = ({ t, onClick }) => (
  <Box>
    <Button onClick={() => onClick()} variant="outlined">
      {t("startUpdate")}
    </Button>
  </Box>
)

const Warning = ({ t, onClick }) => {
  const [userAcceptedRisk, setUserAcceptedRisk] = useState(false)
  return (
    <Box>
      <Typography variant="h5">{t("warning", { ns: "common" })}</Typography>
      <Typography variant="body1" sx={{ my: 1 }}>
        {t("warningMessage1")}
      </Typography>
      <Typography variant="body1">{t("warningMessage2")}</Typography>
      <FormGroup sx={{ display: "flex", alignContent: "center" }}>
        <FormControlLabel
          label={t("consent", { ns: "common" })}
          control={
            <Checkbox
              checked={userAcceptedRisk}
              onChange={(event) => setUserAcceptedRisk(event.target.checked)}
            />
          }
        />
      </FormGroup>
      <Button
        onClick={() => onClick()}
        disabled={!userAcceptedRisk}
        variant="contained"
        sx={{ m: 1 }}
      >
        {t("flashAction")}
      </Button>
    </Box>
  )
}

class StatefulFlasher extends Component {
  constructor(props) {
    super(props)

    this.state = {
      flashState: FlashState.notStarted,
      error: null,
      progress: 0,
    }

    this.reset = this.props.reset
    this.buffer = null
    this.boundOnData = this.onDataFromOnewheel.bind(this)
    this.boundTimeout = this.onOTATimeout.bind(this)
    this.timeout = null
  }

  componentDidUpdate(_, prevState) {
    const { flashState } = this.state

    if (prevState.flashState !== flashState) this.onFlashStateChanged()
  }

  componentWillUnmount() {
    this.stopListening()
  }

  async stopListening() {
    const { serialRead } = this.props.onewheel
    if (serialRead) {
      serialRead.removeEventListener(
        "characteristicvaluechanged",
        this.boundOnData
      )
      console.log("removed event listener", serialRead)
      await serialRead.stopNotifications()
    }
  }

  async onFlashStateChanged() {
    const { flashState } = this.state
    console.log("flash state changed", this.state)

    switch (flashState) {
      case FlashState.inProgress:
        this.startUpdate()
        break
      case FlashState.complete:
        this.stopListening()
        if (this.props.onComplete) this.props.onComplete()
        break
    }
  }

  retryUpdate() {
    this.setState({
      ...this.state,
      flashState: FlashState.notStarted,
      error: null,
      progress: 0,
    })
  }

  async sendFirmwareSizeAndChecksum() {
    const { firmware, onewheel } = this.props
    const { serialWrite } = onewheel

    console.log("sending size and checksum")
    const message = new Uint8Array(20)
    const view = new DataView(message.buffer)
    const { checksum: hash } = checksumForFirmware(firmware, true)
    console.log(hash, firmware.byteLength)

    view.setUint32(0, firmware.byteLength)
    message.set(fromHexString(hash), 4)

    await serialWrite.writeValue(HEADER_MESSAGE)
    await serialWrite.writeValue(message)
  }

  setFlashState(flashState) {
    this.setState({
      ...this.state,
      flashState,
    })
  }

  setError(error) {
    this.setState({
      ...this.state,
      error: error,
      flashState: FlashState.failed,
    })
  }

  async sendFirmwareData() {
    if (this.state.error) return

    const { firmware, onewheel } = this.props
    const { serialWrite } = onewheel

    // start firmware update
    const parts = [...chunks(new Uint8Array(firmware), 20)]
    for (var i = 0; i < parts.length; i++) {
      if (this.state.error) return
      await serialWrite.writeValue(parts[i])

      const progress = ((i + 1) / parts.length) * 100
      this.setState({
        ...this.state,
        progress: progress.toFixed(2),
      })

      clearTimeout(this.timeout)
      this.timeout = setTimeout(this.boundTimeout, OTA_TIMEOUT)
    }

    // wait for device to checksum
    console.log("completed update")
    this.setFlashState(FlashState.complete)
  }

  async onUpdateStateChanged(updateState) {
    const { onewheel } = this.props
    const { serialRead } = onewheel

    switch (updateState) {
      case UpdateState.ready:
        await this.sendFirmwareSizeAndChecksum()
        await sleep(500)
        await this.sendFirmwareData()
        break
      case UpdateState.failCorrupt:
      case UpdateState.failFileSize:
      case UpdateState.failTimeout:
        this.setError(
          this.props.t("updateErrorMessage", { error: updateState.toString() })
        )
        serialRead.stopNotifications()
        break
    }
  }

  async startUpdate() {
    console.log("sending ota start message")
    const { onewheel } = this.props
    const { serialRead, serialWrite } = onewheel
    await serialRead.startNotifications()
    serialRead.addEventListener("characteristicvaluechanged", this.boundOnData)
    await serialWrite.writeValue(START_UPDATE_MESSAGE)
    clearTimeout(this.timeout)
    this.timeout = setTimeout(this.boundTimeout, OTA_TIMEOUT)
  }

  async updateFlashState(data) {
    if (
      data.byteLength === UPDATE_READY_TO_START.length &&
      typedArraysAreEqual(data, UPDATE_READY_TO_START)
    ) {
      this.onUpdateStateChanged(UpdateState.ready)
    } else if (data.byteLength === UPDATE_FAIL_TIMEOUT.length) {
      if (typedArraysAreEqual(data, UPDATE_FAIL_CORRUPT)) {
        this.onUpdateStateChanged(UpdateState.failCorrupt)
      } else if (typedArraysAreEqual(data, UPDATE_FAIL_FILE_SIZE)) {
        this.onUpdateStateChanged(UpdateState.failFileSize)
      } else if (typedArraysAreEqual(data, UPDATE_FAIL_TIMEOUT)) {
        this.onUpdateStateChanged(UpdateState.failTimeout)
      }
    }
  }

  async onDataFromOnewheel(event) {
    const { flashState } = this.state
    clearTimeout(this.timeout)
    this.timeout = setTimeout(this.boundTimeout, OTA_TIMEOUT)
    console.log(event.target.value.buffer)

    let data = new Uint8Array(event.target.value.buffer)
    if (
      (flashState === FlashState.inProgress ||
        flashState === FlashState.complete) &&
      data.byteLength < 16
    ) {
      if (!this.buffer) {
        this.buffer = data
        return
      } else {
        const newBuffer = new Uint8Array(16)
        newBuffer.set(this.buffer)
        newBuffer.set(data, this.buffer.length)
        data = newBuffer
      }
    }

    this.updateFlashState(data)
    this.buffer = null
  }

  verifyUpdateBeforeStart() {
    console.log("verify update before start")
    const { hardwareRevision } = this.props.onewheel
    const { checksum } = checksumForFirmware(this.props.firmware, true)
    const revision = matchFirmwareRevision(checksum)

    let newFirmwareGeneration
    if (revision)
      newFirmwareGeneration = inferBoardFromFirmwareRevision(revision)

    const hardwareGeneration = inferBoardFromHardwareRevision(hardwareRevision)

    if (
      newFirmwareGeneration !== undefined &&
      hardwareGeneration !== undefined &&
      hardwareGeneration === newFirmwareGeneration
    )
      this.setFlashState(FlashState.inProgress)
    else this.setFlashState(FlashState.showWarning)
  }

  onOTATimeout() {
    console.log("ota timeout")
    const { flashState } = this.state
    if (flashState === FlashState.inProgress)
      this.setError(this.props.t("timeoutError"))
    this.stopListening()
  }

  render() {
    const { t, onewheel } = this.props
    const { supported, error: connectionError } = onewheel
    const { flashState, progress, error } = this.state

    if (!supported) return <NotSupported />

    switch (flashState) {
      case FlashState.notStarted:
        return (
          <NotStarted t={t} onClick={() => this.verifyUpdateBeforeStart()} />
        )
      case FlashState.showWarning:
        return (
          <Warning
            t={t}
            onClick={() => this.setFlashState(FlashState.inProgress)}
          />
        )
      case FlashState.inProgress:
        return <UpdateInProgress t={t} progress={progress} />
      case FlashState.failed:
        return (
          <UpdateError
            t={t}
            reset={() => this.props.reset()}
            retry={() => this.retryUpdate()}
          />
        )
      case FlashState.complete:
        return (
          <UpdateComplete t={t} onComplete={() => this.props.onComplete()} />
        )
      default:
        return <></>
    }
  }
}

StatefulFlasher.propTypes = {
  firmware: PropTypes.any,
  reset: PropTypes.func,
  onComplete: PropTypes.func,
}

export const Flasher = (props) =>
  withOnewheelSerial(withTranslation(["flasher", "common"])(StatefulFlasher))(
    props
  )
