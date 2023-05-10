import Container from "@mui/material/Container"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { ToastProvider } from "use-toast-mui"
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material"
import { useEffect, useState } from "react"
import { OnewheelProvider } from "./components/OnewheelProvider"
import FavoriteIcon from "@mui/icons-material/Favorite"
import CodeIcon from "@mui/icons-material/Code"
import MenuIcon from "@mui/icons-material/Menu"
import RewheelLogo from "@assets/ReWheel_Green.svg"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

const navigationItems = [
  { path: "/backup", label: "navigation.backup" },
  { path: "/extras", label: "navigation.extract" },
  { path: "/patch", label: "navigation.patch" },
  { path: "/flash", label: "navigation.flash" },
  { path: "/live", label: "navigation.live" },
  { path: "/resources", label: "Resources (New)" },
]

const otherItems = [
  {
  },
]

function App() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation("common")
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  useEffect(() => {
    const item = navigationItems.find((item) => item.path === location.pathname)
    navigate(item?.path ?? "/")
  }, [])

  const currentIndex = navigationItems.findIndex(
    (item) => item.path === location.pathname
  )

  const open = (path) =>
    path.startsWith("http") ? window.open(path) : navigate(path)

  const drawer = (
    <div sx={{ width: 240 }}>
      <Toolbar />
      <Divider />
      <List>
        {navigationItems.map((navItem) => (
          <ListItem key={navItem.path} disablePadding>
            <ListItemButton>
              <ListItemText
                primary={t(navItem.label)}
                onClick={() => open(navItem.path)}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {otherItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton>
              <ListItemText
                primary={t(item.label)}
                onClick={() => open(item.path)}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <ToastProvider>
      <OnewheelProvider>
        <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <AppBar position="fixed">
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { xs: "block", sm: "none" } }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Link to="/">
                  <img
                    src={RewheelLogo}
                    alt={t("appName")}
                    style={{ height: 20 }}
                  />
                </Link>
              </Box>
              <Box sx={{ display: { sm: "block", xs: "none" } }}>
                {otherItems.map((item) => (
                  <Button
                    color="inherit"
                    onClick={() => open(item.path)}
                    key={item.label}
                  >
                    {item.icon}
                    {t(item.label)}
                  </Button>
                ))}
              </Box>
            </Toolbar>
          </AppBar>
          <Box component="nav" aria-label="navigation">
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: "block", sm: "none" },
                "& .MuiDrawer-paper": {
                  boxSizing: "border-box",
                },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
          <Container
            maxWidth="sm"
            component="main"
            sx={{
              textAlign: "center",
              padding: 2,
              flexGrow: 1,
              p: 3,
            }}
            disableGutters
          >
            <Toolbar />
            <Outlet />
          </Container>
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              display: { sm: "block", xs: "none" },
            }}
            elevation={3}
          >
            <BottomNavigation
              showLabels
              value={currentIndex}
              onChange={(_event, newValue) => {
                navigate(navigationItems[newValue].path)
              }}
            >
              {navigationItems.map((item) => (
                <BottomNavigationAction key={item.path} label={t(item.label)} />
              ))}
            </BottomNavigation>
          </Paper>
        </Box>
      </OnewheelProvider>
    </ToastProvider>
  )
}

export default App
