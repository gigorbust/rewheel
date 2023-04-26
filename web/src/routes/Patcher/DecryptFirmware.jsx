import { Box, Typography } from "@mui/material"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"

const DecryptFirmware = () => {
  const { t } = useTranslation(["patcher", "common"])
  return (
    <Box>
      <Typography variant="h4">{t("decrypt.title")}</Typography>
      <Typography variant="body1">{t("decrypt.subheader")}</Typography>
    </Box>
  )
}

DecryptFirmware.propTypes = {
  firmware: PropTypes.any,
  onDecrypted: PropTypes.func,
}

export default DecryptFirmware
