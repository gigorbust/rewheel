import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardHeader,
  Stack,
  Typography,
} from "@mui/material"
import { Box } from "@mui/system"
import LogoMain from "@assets/logo_main.svg"
import localforage from "localforage"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Trans, useTranslation } from "react-i18next"

const GetStarted = ({ startOnboarding, skipIntro }) => (
  <Card>
    <CardActionArea onClick={startOnboarding}>
      <CardHeader
        title="Get Started"
        subheader="New to Rewheel modifications? Start here"
      />
    </CardActionArea>
    <CardActions>
      <Button size="small" onClick={skipIntro}>
        Skip Intro
      </Button>
    </CardActions>
  </Card>
)

export const HomePage = () => {
  const [onboarded, setOnboarded] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation(["home", "common"])

  useEffect(() => {
    const loadOnboarded = async () => {
      const hasOnboarded = await localforage.getItem("onboarded")
      setOnboarded(hasOnboarded)
    }

    loadOnboarded()
  }, [])

  const skipIntro = () => setOnboarded(true)
  const startOnboarding = () => navigate("/onboarding")

  return (
    <Stack spacing={2} direction="column">
      <Box>
        <img
          src={LogoMain}
          alt={t("appName", { ns: "common" })}
          style={{ height: 50 }}
        />
      </Box>
      <Typography variant="body1">
        {t("appDescription", { ns: "common" })}
      </Typography>
      <Typography variant="body2">{t("warningMessage")}</Typography>
      <Typography variant="body2">
        <Trans t={t} i18nKey="discordLink">
          x<a href="https://discord.gg/kgBeNWMqZn">Rewheel Discord</a>
        </Trans>
      </Typography>

      {/* {!onboarded && (
        <GetStarted skipIntro={skipIntro} startOnboarding={startOnboarding} />
      )} */}
    </Stack>
  )
}
