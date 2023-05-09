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
import CodeIcon from "@mui/icons-material/Code"
import { resources } from "@rewheel/common/resources"

export const ResourcesPage = () => {
  const { t } = useTranslation(["resources", "common"])

  return (
    <Stack spacing={2} direction="column">
      <Box>
        <img
          src={LogoMain}
          alt={t("appName", { ns: "common" })}
          style={{ height: 50 }}
        />
      </Box>
      <Typography variant="body1">{t("Community Resources")}</Typography>
      <List>
      {Object.keys(resources).map((source) => (  
        <ListItem key={source}>
              <ListItemButton
                onClick={() => window.open(resources[source]?.sourceLink)}
                disabled={resources[source].sourceLink === undefined}
              >
                <ListItemIcon>
                  <CodeIcon />
                </ListItemIcon>
                <ListItemText
                  primary={source}
                  secondary={resources[source]?.sourceLink ?? ""}
                />
              </ListItemButton>
            </ListItem>
            ))}
      </List>
    </Stack>
  )
}
