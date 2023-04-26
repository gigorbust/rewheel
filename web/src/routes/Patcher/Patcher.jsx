import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Modal,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { Box } from "@mui/system"
import {
  applyPatch,
  BoardGeneration,
  encryptFirmware,
  getMissingArgs,
  inferBoardFromFirmwareRevision,
  patches,
} from "@rewheel/common"
import PropTypes from "prop-types"
import { useState } from "react"
import { createAndDownloadLink, toDisplayName } from "../../utils"
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined"
import { useToast } from "use-toast-mui"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  GT_APP_OFFSET,
  GT_OTA_LENGTH,
  PRE_GT_APP_OFFSET,
  PRE_GT_OTA_LENGTH,
  BSS_END_ADDRESSES,
} from "@rewheel/common/src/utils/helpers"
import { encryptGTFirmware } from "@rewheel/common/src/utils/encryption"
import { contributors } from "@rewheel/common/contributors"
import { HtmlTooltip } from "../../components/HtmlTooltip"

const Patcher = ({ firmware, metadata, reset, decrypted, encryptionKey }) => {
  const { name, revision, ota, gt } = metadata
  const board = inferBoardFromFirmwareRevision(revision)
  const [operations, setOperations] = useState({})
  const [args, setArgs] = useState({})
  const [patchedFirmware, setPatchedFirmware] = useState(null)
  const [encryptedFirmware, setEncryptedFirmware] = useState(null)
  const [shouldEncrypt, setShouldEncrypt] = useState(ota)
  const [addedBytes, setAddedBytes] = useState(0)
  const toast = useToast()
  const [modalPatch, setModalPatch] = useState(null)
  const { t } = useTranslation(["patcher", "common", "patches"])

  const OTA_LENGTH = gt ? GT_OTA_LENGTH : PRE_GT_OTA_LENGTH
  const OTA_OFFSET = gt ? GT_APP_OFFSET : PRE_GT_APP_OFFSET

  if (decrypted) firmware = decrypted

  const availablePatches = Object.keys(patches).filter(
    (patch) =>
      patches[patch].supported.indexOf(BoardGeneration[board]) !== -1 &&
      (!ota || (ota && patches[patch].supportsOta))
  )

  const toggleOperation = (patchName) => {
    if (!operations[patchName]) {
      const patch = patches[patchName]
      if (patch.confirm) setModalPatch({ name: patchName, patch })
      else setOperations({ ...operations, [patchName]: patch })
    } else {
      const { [patchName]: _patch, ...others } = operations
      setOperations(others)
    }
    setPatchedFirmware(null)
  }

  const setArgValue = (name, value) => {
    const newArgs = { ...args }
    if (value.length > 0) {
      newArgs[name] = value
      setArgs(newArgs)
    } else {
      const { [name]: _arg, ...others } = newArgs
      setArgs(others)
    }
  }

  const applyPatches = () => {
    try {
      let toPatch = firmware
      if (ota) {
        const newBuffer = new Uint8Array(OTA_LENGTH)
        const empty = Array(OTA_LENGTH).fill(0xff)
        newBuffer.set(empty)
        newBuffer.set(new Uint8Array(toPatch), OTA_OFFSET)
        toPatch = newBuffer.buffer
      }

      const appliedPatches = []
      const skipped = []
      const sortedOperations = Object.keys(operations).sort(
        (a, b) => patches[a].priority - patches[b].priority
      )

      let totalAddedBytes = 0
      let bssEndIndex = BSS_END_ADDRESSES[revision]

      for (const operation of sortedOperations) {
        const patch = patches[operation]
        const translatedOperationName = t(`${operation}.name`, {
          ns: "patches",
        })
        const missingArgs = getMissingArgs(args, patch)

        if (missingArgs.length > 0)
          throw `Missing ${missingArgs
            .map((arg) => t(`${operation}.args.${arg}.name`, { ns: "patches" }))
            .join(",")}`

        console.log("applying", operation)
        try {
          const {
            firmware: patchedFirmware,
            applied,
            addedFirmwareLength,
            addedBssLength,
          } = applyPatch(
            toPatch,
            revision,
            patch,
            OTA_OFFSET + firmware.byteLength + totalAddedBytes,
            bssEndIndex,
            gt,
            args
          )

          if (!applied) skipped.push(operation)
          else {
            appliedPatches.push(operation)
            toPatch = patchedFirmware
          }

          totalAddedBytes += addedFirmwareLength
          bssEndIndex += addedBssLength
        } catch (err) {
          throw `${translatedOperationName}: ${t(`${operation}.errors.${err}`, {
            ns: "patches",
          })}`
        }
      }

      setAddedBytes(totalAddedBytes)

      if (appliedPatches.length === Object.keys(operations).length)
        toast.success(
          t("appliedPatchSuccess", { count: appliedPatches.length })
        )
      else if (appliedPatches.length > 0)
        toast.warning(
          t("appliedPatchWarning", {
            applied: appliedPatches.length,
            skipped: skipped.length,
            patches: skipped
              .map((op) => t(`${op}.name`, { ns: "patches" }))
              .join(", "),
          })
        )
      else throw t("appliedPatchNone")
      setPatchedFirmware(toPatch)
    } catch (err) {
      console.error(t(err))
      toast.error(err.message ?? err)
    }
  }

  const downloadPatchedFirmware = () => {
    // todo: eventually rebuild ota firmware w/ previously dumped OTA + settings sections
    const suffix = ota ? "-decrypted" : ""

    createAndDownloadLink(
      ota
        ? patchedFirmware.slice(
            OTA_OFFSET,
            OTA_OFFSET + firmware.byteLength + addedBytes
          )
        : patchedFirmware,
      `${name.replace(".bin", "")}-patched${suffix}.bin`
    )
  }

  const downloadEncryptedFirmware = () => {
    createAndDownloadLink(
      encryptedFirmware,
      `${name.replace(".bin", "")}-patched.bin`
    )
  }

  const cancelOperation = () => {
    setModalPatch(null)
  }

  const confirmOperation = () => {
    setOperations({ ...operations, [modalPatch.name]: modalPatch.patch })
    setModalPatch(null)
  }

  useEffect(() => {
    if (patchedFirmware && ota)
      setEncryptedFirmware(
        gt
          ? encryptGTFirmware(
              patchedFirmware.slice(
                OTA_OFFSET,
                ota ? OTA_OFFSET + firmware.byteLength + addedBytes : OTA_LENGTH
              ),
              encryptionKey.key,
              encryptionKey.iv
            )
          : encryptFirmware(
              patchedFirmware.slice(
                OTA_OFFSET,
                ota ? OTA_OFFSET + firmware.byteLength + addedBytes : OTA_LENGTH
              ),
              encryptionKey.key
            )
      )
    else setEncryptedFirmware(null)
  }, [patchedFirmware])

  return (
    <>
      <List>
        <Card sx={{ my: 2 }}>
          <CardHeader
            title={toDisplayName(board ?? "")}
            subheader={
              <>
                <Chip label={revision} />
                {ota && <Chip label="OTA" sx={{ ml: 1 }} />}
                <IconButton onClick={() => reset()}>
                  <RefreshOutlinedIcon />
                </IconButton>
              </>
            }
          />
          <CardContent>
            <List>
              <CardHeader title={t("availablePatches")} />
              {availablePatches.map((patch) => (
                <Box key={patch}>
                  <ListItemButton
                    role={undefined}
                    onClick={() => toggleOperation(patch)}
                    dense
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={operations[patch] !== undefined}
                        tabIndex={-1}
                      />
                    </ListItemIcon>
                    <ListItemText
                      secondary={
                        <>
                          {t(`${patch}.description`, { ns: "patches" }) ?? ""}
                          <br />
                          <Typography variant="caption">
                            {t("byline", { ns: "patcher" })}
                            {patches[patch].attribution.map((author) => (
                              <HtmlTooltip
                                title={
                                  <>
                                    <Typography variant="subtitle1">
                                      <a href={contributors[author]?.github}>
                                        {author}
                                      </a>
                                    </Typography>
                                    {contributors[author]?.sponsor && (
                                      <Typography variant="caption">
                                        {t("sponsor", { ns: "patcher" })}{" "}
                                        {contributors[author]?.sponsor}
                                      </Typography>
                                    )}
                                  </>
                                }
                                key={author}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ mx: 0.2, textDecoration: "underline" }}
                                >
                                  {author}
                                </Typography>
                              </HtmlTooltip>
                            ))}
                          </Typography>
                        </>
                      }
                    >
                      {t(`${patch}.name`, { ns: "patches" })}
                      {patches[patch].experimental && (
                        <Chip
                          label={t("experimental.title")}
                          color="warning"
                          size="small"
                          variant="outlined"
                          sx={{ mx: 1 }}
                        />
                      )}
                    </ListItemText>
                  </ListItemButton>
                  {operations[patch] !== undefined &&
                    patches[patch].args !== undefined && (
                      <Collapse
                        in={operations[patch] !== undefined}
                        timeout="auto"
                        unmountOnExit
                        sx={{ padding: "12px" }}
                      >
                        {Object.keys(patches[patch].args).map((arg) => (
                          <Box key={arg}>
                            <TextField
                              key={arg}
                              variant="outlined"
                              label={t(`${patch}.args.${arg}.name`, {
                                ns: "patches",
                              })}
                              helperText={t(
                                `${patch}.args.${arg}.description`,
                                {
                                  ns: "patches",
                                }
                              )}
                              required={patches[patch].args[arg].required}
                              type={
                                patches[patch].args[arg].type === "number"
                                  ? "number"
                                  : "text"
                              }
                              min={patches[patch].args[arg].min ?? 0}
                              max={patches[patch].args[arg].max ?? 0}
                              fullWidth={true}
                              margin="dense"
                              onChange={(event) =>
                                setArgValue(arg, event.target.value)
                              }
                            />
                          </Box>
                        ))}
                      </Collapse>
                    )}
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
        <Button
          onClick={() => applyPatches()}
          variant="outlined"
          sx={{ margin: 1 }}
        >
          {t("applyPatchesAction")}
        </Button>

        <FormControlLabel
          control={
            <Checkbox
              checked={shouldEncrypt}
              onChange={() => setShouldEncrypt(!shouldEncrypt)}
              disabled={!ota}
            />
          }
          label={t("encryptFirmware")}
        />

        {patchedFirmware && (
          <Button
            onClick={() =>
              shouldEncrypt
                ? downloadEncryptedFirmware()
                : downloadPatchedFirmware()
            }
            variant="outlined"
            sx={{ margin: 1 }}
          >
            {t("downloadFirmware")}
          </Button>
        )}
      </List>
      <Modal open={modalPatch !== null} onClose={cancelOperation}>
        <Card>
          <CardHeader
            title={t("confirm.title")}
            subheader={
              modalPatch?.patch.experimental && t("experimental.message")
            }
          />
          <CardContent>
            <Typography variant="body1">
              {t(`${modalPatch?.name}.confirmation`, { ns: "patches" }) ??
                t("confirm.message")}
            </Typography>
          </CardContent>
          <CardActions>
            <Button onClick={cancelOperation} variant="outlined">
              {t("actions.cancel", { ns: "common" })}
            </Button>
            <Button onClick={confirmOperation} variant="contained">
              {t("actions.confirm", { ns: "common" })}
            </Button>
          </CardActions>
        </Card>
      </Modal>
    </>
  )
}

Patcher.propTypes = {
  firmware: PropTypes.any,
  metadata: PropTypes.shape({
    name: PropTypes.string,
    checksum: PropTypes.string,
    revision: PropTypes.number,
    ota: PropTypes.bool,
  }),
  reset: PropTypes.func,
  decrypted: PropTypes.any,
  encryptionKey: PropTypes.shape({
    key: PropTypes.string,
    iv: PropTypes.string,
  }),
}

export default Patcher
