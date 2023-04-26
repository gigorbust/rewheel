import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material"
import { encryptFirmware } from "@rewheel/common"
import localforage from "localforage"
import { useState } from "react"
import { useEffect } from "react"
import { useFirmwareLoader } from "@hooks"
import { createAndDownloadLink } from "../../utils"
import NotStarted from "../Patcher/NotStarted"
import { useTranslation } from "react-i18next"
import { useEncryptionKey } from "@hooks"

export const OTAConverter = () => {
  const { t } = useTranslation(["extras", "common"])
  const { file, firmware, showFirmwareInput } = useFirmwareLoader()
  const key = useEncryptionKey()
  const [acknowledged, setAcknowledged] = useState(false)

  const saveOTAFirmware = async () => {
    createAndDownloadLink(
      encryptFirmware(firmware.slice(0x3000, 0xfd00), key),
      `encrypted-${file.name}`
    )
  }

  return (
    <Card>
      <CardHeader
        title={t("otaConverter.title")}
        subheader={t("otaConverter.subheader")}
      />
      <CardContent>
        {!firmware && <NotStarted showFirmwareInput={showFirmwareInput} />}
        {firmware && key && (
          <>
            <FormGroup sx={{ display: "flex", alignContent: "center" }}>
              <FormControlLabel
                label={t("otaConverter.confirmation")}
                control={
                  <Checkbox
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                  />
                }
              />
            </FormGroup>
            <Button
              onClick={() => saveOTAFirmware()}
              variant="outlined"
              disabled={!acknowledged}
            >
              {t("otaConverter.downloadOTA")}
            </Button>
          </>
        )}
        {firmware && !key && (
          <Typography variant="body1">
            {t("needEncryptionKey", { ns: "common" })}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
