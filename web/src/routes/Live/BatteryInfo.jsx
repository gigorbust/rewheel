import { Card, CardContent, CardHeader, Typography } from "@mui/material"
import {
  useBatteryPercentage,
  useBatteryTemperature,
  useBatteryVoltage,
} from "@hooks"
import { useTranslation } from "react-i18next"

export const BatteryInfo = () => {
  const batteryVoltage = useBatteryVoltage()
  const batteryPercentage = useBatteryPercentage()
  const batteryTemperature = useBatteryTemperature()
  const { t } = useTranslation("live")

  return (
    <Card sx={{ my: 2 }}>
      <CardHeader title={t("battery.title")} />
      <CardContent>
        <Typography variant="h6">{t("battery.stateOfCharge")}</Typography>
        <Typography variant="body1">
          {batteryVoltage}V ({batteryPercentage}%) - {batteryTemperature}&deg;C
        </Typography>
      </CardContent>
    </Card>
  )
}
