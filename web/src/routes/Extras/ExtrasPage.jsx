import { OTAConverter, Box, Stack, KeyExtraction, OTADownloader } from "./"

export const ExtrasPage = () => {
  return (
    <Box sx={{ my: 1 }}>
      <Stack spacing={2} direction="column">
        <KeyExtraction />
        {/* <OTADownloader /> */}
        //<OTAConverter />
      </Stack>
    </Box>
  )
}
