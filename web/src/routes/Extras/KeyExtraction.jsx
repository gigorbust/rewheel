import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Typography,
} from "@mui/material"
import { extractKey } from "@rewheel/common"
import localforage from "localforage"
import { useState } from "react"
import { Form } from "react-router-dom"
import { useToast } from "use-toast-mui"
import { useFirmwareLoader } from "@hooks"
import { useTranslation } from "react-i18next"

export const KeyExtraction = () => {
  const { firmware, showFirmwareInput } = useFirmwareLoader()
  const { t } = useTranslation("extras")
  const [extracted, setExtracted] = useState(null)
  const toast = useToast()
  const [extracting, setExtracting] = useState(false)

  const getKey = async () => {
    setExtracting(true)
    const extracted = await extractKey(firmware)
    if (extracted) setExtracted(extracted)
    else toast.error(t("keyExtractor.failed"))
    setExtracting(false)
  }

  const saveKey = () => {
    if (extracted.iv) {
      localforage.setItem("decryption-key-gt", extracted.key)
      localforage.setItem("decryption-iv-gt", extracted.iv)
    } else {
      localforage.setItem("decryption-key", extracted.key)
    }
    toast.success(t("keyExtractor.saved"))
  }

  return (
    <Card>
      <CardHeader title={t("keyExtractor.title")} />
      <CardContent>
        <Form>{showFirmwareInput()}</Form>
        <Button
          onClick={() => getKey()}
          sx={{ my: 1 }}
          variant="outlined"
          disabled={!firmware || extracting}
        >
          {!extracting
            ? t("keyExtractor.action")
            : t("keyExtractor.actionInProgress")}
        </Button>
        {extracted && (
          <Box sx={{ my: 1 }}>
            <Typography variant="h6">
              {t("keyExtractor.encryptionKey")}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {extracted.key}
            </Typography>
            {extracted.iv && (
              <>
                <Typography variant="h6">
                  {t("keyExtractor.encryptionIV")}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {extracted.iv}
                </Typography>
              </>
            )}
            <Button onClick={() => saveKey()} variant="outlined">
              {t("keyExtractor.saveKey")}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
