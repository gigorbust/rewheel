import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import { Box } from "@mui/system"
import LogoMain from "@assets/logo_main.svg"
import { useTranslation } from "react-i18next"
import { contributors } from "@rewheel/common/contributors"
import CodeIcon from "@mui/icons-material/Code"

export const AboutPage = () => {
  const { t } = useTranslation(["about", "common"])

  return (
    <Stack spacing={2} direction="column">
      <Box>
        <img
          src={LogoMain}
          alt={t("appName", { ns: "common" })}
          style={{ height: 50 }}
        />
      </Box>
      <Typography variant="body1">{t("description")}</Typography>
      <Typography variant="body2">{t("disclaimer")}</Typography>
      <Typography variant="h4">{t("contribute")}</Typography>
      <Typography variant="body2">{t("credits")}</Typography>
      <List>
        {Object.keys(contributors).map((author) => (
          <ListItem key={author}>
            <ListItemButton
              onClick={() => window.open(contributors[author]?.sponsor)}
              disabled={contributors[author].sponsor === undefined}
            >
              <ListItemIcon>
                <CodeIcon />
              </ListItemIcon>
              <ListItemText
                primary={author}
                secondary={contributors[author]?.sponsor ?? ""}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  )
}
