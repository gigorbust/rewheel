import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material"
import { Box } from "@mui/system"
import {
  BoardGeneration,
  inferBoardFromHardwareRevision,
} from "@rewheel/common"
import { useEffect, useState } from "react"
import { Dumper } from "./Dumper"
import { useFirmwareRevision, useHardwareRevision } from "@hooks"
import { EnforceGeneration } from "../../components/EnforceGeneration"
import { useTranslation } from "react-i18next"
import { BoardSelector } from "../../components/BoardSelector"

const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_PATH

export const Backup = () => {
  const [firmware, setFirmware] = useState(null)
  const [firmwareLoadError, setFirmwareLoadError] = useState(false)
  const hardwareRevision = useHardwareRevision()
  const firmwareRevision = useFirmwareRevision()
  const { t } = useTranslation("backup")

  const onBoardSelected = async (generation) => {
    try {
      setFirmwareLoadError(null)
      generation =
        generation ??
        inferBoardFromHardwareRevision(hardwareRevision).toLowerCase()
      const response = await fetch(
        `/${generation}-signed-extractor.bin`)

      const data = await response.arrayBuffer()
      setFirmware(data)
    } catch (err) {
      setFirmwareLoadError(err)
    }
  }

  useEffect(() => {
    if (!hardwareRevision) return
    onBoardSelected()
  }, [hardwareRevision])

  const loadedDeviceVersionSuccess =
    firmwareRevision !== 0 && hardwareRevision !== 0
  const board = inferBoardFromHardwareRevision(hardwareRevision)

  return (
    <Box sx={{ my: 1 }}>
      <Card>
        <CardHeader
          title={t("title")}
          subheader={t("connectedSubheader", {
            board,
            hardwareRevision,
            firmwareRevision,
          })}
        />
        <CardContent>
          <EnforceGeneration
            allowedGenerations={[BoardGeneration.Pint, BoardGeneration.GT]}
            generation={BoardGeneration[board] ?? BoardGeneration.GT}
          >
            {loadedDeviceVersionSuccess && !firmware && !firmwareLoadError && (
              <>
                <Typography variant="body1">{t("loadingExtractor")}</Typography>
                <CircularProgress />
              </>
            )}
            {loadedDeviceVersionSuccess && !firmware && firmwareLoadError && (
              <Typography variant="body1">
                {t("unableToLoadExtractor")}
              </Typography>
            )}
            {!loadedDeviceVersionSuccess && !firmware && !firmwareLoadError && (
              <>
                <Typography variant="body1">
                  {t("unableToDetermineBoard")}
                </Typography>
                <BoardSelector
                  onBoardSelected={(generation) => onBoardSelected(generation)}
                />
              </>
            )}
            {firmware && (
              <Dumper firmware={firmware} generation={BoardGeneration[board]} />
            )}
          </EnforceGeneration>
        </CardContent>
      </Card>
    </Box>
  )
}
