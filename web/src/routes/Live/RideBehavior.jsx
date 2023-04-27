import {
  AppBar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Dialog,
  IconButton,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material"
import {
  BoardGeneration,
  inferBoardFromHardwareRevision,
} from "@rewheel/common"
import { useLights, useHardwareRevision } from "@hooks"
import {
  RideMode,
  RideModeReverseMap,
  useRideMode,
  useRideTraits,
} from "@hooks"
import FlashlightOffIcon from "@mui/icons-material/FlashlightOff"
import FlashlightOnIcon from "@mui/icons-material/FlashlightOn"
import DoDisturbOnIcon from "@mui/icons-material/DoDisturbOn"
import DoDisturbOffIcon from "@mui/icons-material/DoDisturbOff"
import { useTheme } from "@emotion/react"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import CloseIcon from "@mui/icons-material/Close"
import { preventHorizontalKeyboardNavigation } from "../../utils"
import { SplitButton } from "../../components/SplitButton"

const RideMapV1 = [
  RideMode.V1Classic,
  RideMode.V1Extreme,
  RideMode.V1ElevatedBay,
]

const RideMapPlusXR = [
  RideMode.SequoiaRoam,
  RideMode.CruzRedwoodFlow,
  RideMode.MissionPacificHighline,
  RideMode.Elevated,
  RideMode.DeliriumSkylineApex,
  RideMode.Custom,
]
const RideMapPintPintX = RideMapPlusXR.slice(1)

const RideMapGT = [
  RideMode.V1ElevatedBay,
  RideMode.SequoiaRoam,
  RideMode.CruzRedwoodFlow,
  RideMode.MissionPacificHighline,
  RideMode.Elevated,
  RideMode.DeliriumSkylineApex,
  RideMode.Custom,
]

export const RideBehavior = () => {
  const hardwareRevision = useHardwareRevision()
  const { rideMode, setRideMode } = useRideMode()
  const { lights, setLights } = useLights()
  const theme = useTheme()
  const { t } = useTranslation("live")
  const [remoteTilt, showRemoteTilt] = useState(false)
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("sm"))
  const generation = BoardGeneration[inferBoardFromHardwareRevision(hardwareRevision)]
  const {
    turnCompensation,
    angleOffset,
    aggressiveness,
    simpleStop,
    setAggressiveness,
    setTurnCompensation,
    setAngleOffset,
    setSimpleStop,
    valid: rideTraitsValid,
  } = useRideTraits(generation)
  let rideModes = []
  let gamepadIndex;
///
  const [refreshIntervalID, setRefreshIntervalID] = useState(null)

  const enableGamePad = () => {
    window.addEventListener('gamepadconnected', (event) => {
      gamepadIndex = event.gamepad.index;
      startInterval(gamepadIndex);
    })
    window.addEventListener("gamepaddisconnected", (event) => {
      console.log("Lost connection with the gamepad.");
      gamepadIndex = null;
      setRefreshIntervalID(null);
      clearInterval(refreshIntervalID)
    })
  }

  const startInterval = (gamepadIndex) => {
    const intervalId = setInterval(() => {
      if(gamepadIndex !== undefined) {
        const myGamepad = navigator.getGamepads()[gamepadIndex];
        setAngleOffset(-(((myGamepad.axes[1]) * 30 )/ 10), true);
      }
    }, 100);
    setRefreshIntervalID(intervalId);
  }

  const disableGamePad = () => {
    clearInterval(refreshIntervalID); // clear interval here
    setRefreshIntervalID(null);
    gamepadIndex = null;
  }

  const restartInterval = () => {
    if (refreshIntervalID === null) {
      startInterval(gamepadIndex);
    }
  };
  
  const closeRemoteTilt = () => {
    setAngleOffset(0.0, true)
    showRemoteTilt(false)
    //if gamepad exists do the following, else nothing
    disableGamePad()
    

  }
///
  switch (generation) {
    case BoardGeneration.V1:
    case BoardGeneration.V1_2:
      rideModes = RideMapV1
      break
    case BoardGeneration.Plus:
    case BoardGeneration.XR:
      rideModes = RideMapPlusXR
      break
    case BoardGeneration.Pint:
    case BoardGeneration.PintX:
      rideModes = RideMapPintPintX
      break
    case BoardGeneration.GT:
      rideModes = RideMapGT
      break
    default:
      break
  }

  return (
    <Card sx={{ my: 1 }}>
      <CardHeader title={t("rideBehavior.title")} />
      <CardContent>
        <Stack spacing={2} direction="column">
          <Stack
            spacing={4}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body1">{t("rideBehavior.lights")}</Typography>
            <ToggleButton
              selected={lights?.enabled}
              onClick={() => setLights(!lights?.enabled)}
            >
              {lights?.enabled ? <FlashlightOffIcon /> : <FlashlightOnIcon />}
            </ToggleButton>
            {generation === BoardGeneration.GT && lights?.enabled && (
              <Slider
                value={lights?.brightness}
                valueLabelDisplay="auto"
                min={0}
                max={100}
                step={1.0}
                onChange={async (event) =>
                  await setLights(
                    lights?.enabled,
                    parseInt(event.target.value) / 100
                  )
                }
              />
            )}
          </Stack>
          {generation >= BoardGeneration.Plus && (
            <Stack
              spacing={4}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="body1">
                {t("rideBehavior.simpleStop")}
              </Typography>
              <ToggleButton
                selected={simpleStop ?? false}
                onClick={() => setSimpleStop(!simpleStop)}
              >
                {simpleStop ? <DoDisturbOffIcon /> : <DoDisturbOnIcon />}
              </ToggleButton>
            </Stack>
          )}
          <Stack
            spacing={{ xs: 1, sm: 4 }}
            direction={{ sm: "column", md: "row" }}
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body1">{t("rideBehavior.mode")}</Typography>
            <SplitButton
              selected={rideMode}
              options={rideModes.map((mode) => {
                return {
                  label: RideModeReverseMap(generation)[mode],
                  value: mode,
                }
              })}
              onChanged={(mode) => setRideMode(mode)}
            />
          </Stack>
          {rideMode === RideMode.Custom && rideTraitsValid && (
            <Stack
              spacing={4}
              direction={{ sm: "column", md: "row" }}
              alignItems="center"
            >
              <Stack spacing={2} direction="column" alignItems="center">
                <Typography variant="body1">
                  {t("rideBehavior.customShaping.carveability")}
                </Typography>
                <Slider
                  value={turnCompensation}
                  min={0}
                  max={10}
                  step={1.0}
                  marks
                  sx={{ width: 150 }}
                  valueLabelDisplay="auto"
                  onChange={(event) => setTurnCompensation(event.target.value)}
                />
              </Stack>
              <Stack spacing={2} direction="column" alignItems="center">
                <Typography variant="body1">
                  {t("rideBehavior.customShaping.angleOffset")}
                </Typography>
                <Slider
                  value={angleOffset}
                  min={-1.5}
                  max={3}
                  step={0.1}
                  marks
                  sx={{ width: 150 }}
                  valueLabelDisplay="auto"
                  onChange={(event) =>
                    setAngleOffset(
                      event.target.value,
                      generation !== BoardGeneration.XR
                    )
                  }
                />
              </Stack>
              <Stack spacing={2} direction="column" alignItems="center">
                <Typography variant="body1">
                  {t("rideBehavior.customShaping.aggressiveness")}
                </Typography>
                <Slider
                  value={aggressiveness}
                  min={0}
                  max={10}
                  sx={{ width: 150 }}
                  step={1.0}
                  marks
                  valueLabelDisplay="auto"
                  onChange={(event) => setAggressiveness(event.target.value)}
                />
              </Stack>
            </Stack>
          )}
          {rideMode === RideMode.Custom && (
            <Button
              variant="outlined"
              onClick={() => {
                showRemoteTilt(true)
                enableGamePad()
                restartInterval(gamepadIndex)
                //setAngleOffset(0.0, true)

              }}
            >
              {t("rideBehavior.customShaping.remoteTilt")}
            </Button>
          )}
        </Stack>
      </CardContent>
      <Dialog fullScreen={true} open={remoteTilt} onClose={closeRemoteTilt}>
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={closeRemoteTilt}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            {t("rideBehavior.customShaping.remoteTilt")}
          </Toolbar>
        </AppBar>
        <Container
          maxWidth="sm"
          sx={{
            flexDirection: "column",
            alignItems: "center",
            height: "100vh",
            width: "unset",
            padding: 12,
          }}
        >
          <Slider
            sx={{
              '& input[type="range"]': {
                WebkitAppearance: "slider-vertical",
              },
            }}
            orientation="vertical"
            aria-label={t("rideBehavior.customShaping.remoteTilt")}
            valueLabelDisplay="auto"
            min={-3}
            max={3}
            step={0.1}
            height={150}
            value={angleOffset}
            onChange={(event) =>
              preventHorizontalKeyboardNavigation(event, () =>
                setAngleOffset(
                  event.target.value,
                  true,
                  generation !== BoardGeneration.XR
                )
              )
            }
            onChangeCommitted={(event) => {
              event.target.value = 0
              setAngleOffset(
                event.target.value,
                true,
                generation !== BoardGeneration.XR
              )
            }}
          />
        </Container>
      </Dialog>
    </Card>
  )
}


