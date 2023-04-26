import { Card, CardContent, CardHeader, Typography } from "@mui/material"
import { Box } from "@mui/system"
import { Flasher } from "./Flasher"
import { useFirmwareLoader } from "@hooks"
import { ConnectionManager } from "../../components/ConnectionManager"
import { useTranslation } from "react-i18next"

export const FlasherPage = () => {
  const { t } = useTranslation(["flasher", "common"])
  const { firmware, showFirmwareInput } = useFirmwareLoader()

  return (
    <ConnectionManager title={t("title")} subheader={t("subheader")}>
      <Box sx={{ my: 1 }}>
        <Card>
          <CardHeader title={t("selectFirmware.title", { ns: "common" })} />
          <CardContent>{showFirmwareInput()}</CardContent>
        </Card>
        {firmware && (
          <Card sx={{ my: 1 }}>
            <CardHeader title={t("title")} />
            <CardContent>
              <Flasher firmware={firmware ?? selectedFirmware} />
            </CardContent>
          </Card>
        )}
      </Box>
    </ConnectionManager>
  )
}
