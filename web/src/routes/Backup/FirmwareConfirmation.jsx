import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from "@mui/material"
import {
  checksumForFirmware,
  matchFirmwareRevision,
} from "@rewheel/common/src/utils/checksum"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useFirmwareLoader } from "../../hooks/useFirmwareLoader"

export const FirmwareConfirmation = ({ onHasValidOTA }) => {
  const { t } = useTranslation("backup")
  const { firmware, showFirmwareInput } = useFirmwareLoader()
  const [haltBackup, setHaltBackup] = useState(false)

  useEffect(() => {
    if (firmware) {
      const { checksum, ota, gt } = checksumForFirmware(firmware)
      const revision = matchFirmwareRevision(checksum)
      if (revision === undefined) setHaltBackup(true)
      else onHasValidOTA(true)
    }
  }, [firmware])

  return (
    <Box sx={{ my: 1 }}>
      <Card>
        <CardHeader
          title={t("confirmation.title")}
          subheader={t("confirmation.subtitle")}
        />
        <CardContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t("confirmation.description")}
          </Typography>
          {showFirmwareInput()}
          <Typography variant="body1" sx={{ mt: 2 }}>
            {haltBackup && t("confirmation.haltBackup")}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
