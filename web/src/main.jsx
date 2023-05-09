import React from "react"
import { createRoot } from "react-dom/client"
import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"
import App from "./App"
import theme from "./theme"

import { createBrowserRouter, RouterProvider } from "react-router-dom"
import ErrorPage from "./ErrorPage"
import PatcherPage from "./routes/Patcher"
import { ExtrasPage } from "./routes/Extras"
import { FlasherPage } from "./routes/Flasher"
import { HomePage } from "./routes/Home"
import { LivePage } from "./routes/Live/LivePage"


import { BackupPage } from "./routes/Backup"

// import { OnboardingPage } from "./routes/Onboarding"
import "./i18n"

import { registerSW } from "virtual:pwa-register"
import { AboutPage } from "./routes/About"
import { ResourcesPage } from "./routes/Resources"
registerSW({ immediate: true })

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/backup",
        element: <BackupPage />,
      },
      {
        path: "/patch",
        element: <PatcherPage />,
      },
      {
        path: "/flash",
        element: <FlasherPage />,
      },
      {
        path: "/extras",
        element: <ExtrasPage />,
      },
      {
        path: "/live",
        element: <LivePage />,
      },
      {
        path: "/about",
        element: <AboutPage />,
      },
      {
        path: "/resources",
        element: <ResourcesPage />,
      },
    ],
  },
])

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
