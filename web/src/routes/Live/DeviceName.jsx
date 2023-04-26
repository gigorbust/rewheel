import { Card, CardHeader, Typography } from "@mui/material"
import { useTranslation } from "react-i18next"
import { useOnewheel } from "../../hooks/useOnewheel"

export const DeviceName = () => {
  const { device } = useOnewheel()
  const { t } = useTranslation("live")

  return <Typography variant="h4">{device.name}</Typography>
}
