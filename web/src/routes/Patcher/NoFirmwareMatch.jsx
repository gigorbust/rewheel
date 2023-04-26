import PropTypes from "prop-types"
import { Button, Typography } from "@mui/material"
import { Box } from "@mui/system"
import { Trans, useTranslation } from "react-i18next"

const NoFirmwareMatch = ({ reset, checksum }) => {
  const { t } = useTranslation(["patcher", "common"])
  return (
    <Box>
      <Typography variant="h4">
        {t("notSupported.title", { ns: "common" })}
      </Typography>
      <Typography variant="body1">
        <Trans t={t} i18nKey="notSupported.noFirmwareMatch">
          x
          <a
            href={`https://github.com/outlandnish/rewheel/issues?q=is%3Aissue+is%3Aopen+${checksum}`}
          >
            open or upvote
          </a>
          b
        </Trans>
      </Typography>
      <Button variant="outlined" onClick={() => reset()} sx={{ my: 2 }}>
        {t("notSupported.tryAgainAction")}
      </Button>
    </Box>
  )
}

NoFirmwareMatch.propTypes = {
  reset: PropTypes.func,
  checksum: PropTypes.string,
}

export default NoFirmwareMatch
