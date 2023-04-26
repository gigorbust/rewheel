import { Card, CardContent, CardHeader } from "@mui/material"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

const NotStarted = ({ showFirmwareInput, title }) => {
  const { t } = useTranslation("common")
  return (
    <Card sx={{ my: 1 }}>
      <CardHeader title={title ?? t("selectFirmware.title")} />
      <CardContent>{showFirmwareInput()}</CardContent>
    </Card>
  )
}

export default NotStarted

NotStarted.propTypes = {
  showFirmwareInput: PropTypes.func,
}
