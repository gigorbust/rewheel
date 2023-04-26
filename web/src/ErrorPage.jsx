import { Box, Container, Typography } from "@mui/material"
import { useRouteError } from "react-router-dom"

export default function ErrorPage() {
  const error = useRouteError()
  console.error(error)

  return (
    <Container id="error-page">
      <Typography variant="h3">Oops!</Typography>
      <Box my={4}>
        <Typography variant="body1">
          Sorry, an unexpected error has occurred.
        </Typography>
        <Typography variant="body2">
          <i>{error.statusText || error.message}</i>
        </Typography>
      </Box>
    </Container>
  )
}
