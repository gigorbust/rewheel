import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material"
import { useState } from "react"
import { parseString } from "js-parse-xml"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import { useTranslation } from "react-i18next"
import { BoardSelector } from "../../components/BoardSelector"
import { inferBoardFromUpdateFile } from "../../utils"

export const OTADownloader = () => {
  const { t } = useTranslation("extras")
  const [fetching, setFetching] = useState(false)
  const [triedFetching, setTriedFetching] = useState(false)
  const [updates, setUpdates] = useState([])
  const [boardGeneration, setBoardGeneration] = useState(null)

  const getOTAUpdates = async () => {
    try {
      setFetching(true)
      const response = await fetch("/api/get-updates")
      if (response.ok || response.redirected) {
        const data = await response.text()
        const parsed = await parseString(data)
        const found = parsed.ListBucketResult.Contents.filter(
          (obj) => obj.Key.indexOf(".bin") >= 0
        )
        setUpdates(found)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTriedFetching(true)
      setFetching(false)
    }
  }

  const downloadUpdate = async (key) => {
    window.open(`https://s3-us-west-1.amazonaws.com/1wheel/${key}`)
  }

  let filteredUpdates = []
  if (updates && boardGeneration)
    filteredUpdates = updates
      .filter((update) => {
        const board = inferBoardFromUpdateFile(update.Key)
        console.log(board, boardGeneration)
        return board === boardGeneration
      })
      .sort(
        (update, secondUpdate) =>
          new Date(update.LastModified) - new Date(secondUpdate.LastModified)
      )

  return (
    <Card>
      <CardHeader
        title={t("otaFinder.title")}
        subheader={t("otaFinder.subheader")}
      />
      <CardContent>
        {!triedFetching && (
          <Button
            onClick={() => getOTAUpdates()}
            variant="contained"
            disabled={fetching}
          >
            {fetching && <CircularProgress size={24} sx={{ mr: 1 }} />}
            {t("otaFinder.findUpdates")}
          </Button>
        )}
        {triedFetching && !boardGeneration && (
          <BoardSelector
            onBoardSelected={(generation) => setBoardGeneration(generation)}
          />
        )}
        {triedFetching > 0 && boardGeneration && (
          <Button
            onClick={() => setBoardGeneration(null)}
            variant="outlined"
            sx={{ m: 1 }}
          >
            {t("otaFinder.selectDifferentBoard")}
          </Button>
        )}

        {boardGeneration &&
          boardGeneration !== "GT" &&
          filteredUpdates.length === 0 && (
            <Typography variant="body1">
              {t("otaFinder.noUpdatesFound")}
            </Typography>
          )}

        {(filteredUpdates?.length > 0 || boardGeneration === "GT") && (
          <List>
            {filteredUpdates.map((update) => (
              <ListItem
                key={update.Key}
                disablePadding
                secondaryAction={
                  <IconButton onClick={() => downloadUpdate(update.Key)}>
                    <FileDownloadIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={update.Key}
                  secondary={update.LastModified}
                />
              </ListItem>
            ))}
            {boardGeneration === "GT" && (
              <ListItem
                disablePadding
                secondaryAction={
                  <IconButton
                    onClick={() =>
                      window.open(
                        "https://owfw.s3.us-west-1.amazonaws.com/encryptedfw6109.bin"
                      )
                    }
                  >
                    <FileDownloadIcon />
                  </IconButton>
                }
              >
                <ListItemText primary="encryptedfw6109.bin" />
              </ListItem>
            )}
          </List>
        )}
      </CardContent>

      {!boardGeneration && <CardContent></CardContent>}
    </Card>
  )
}
