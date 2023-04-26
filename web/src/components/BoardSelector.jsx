import { FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import {
  BoardGeneration,
  inferBoardFromHardwareRevision,
} from "@rewheel/common"
import { useTranslation } from "react-i18next"

export const BoardSelector = ({ onBoardSelected }) => {
  const { t } = useTranslation("common")

  const getFirmwareForRevision = (revision) => {
    const generation = inferBoardFromHardwareRevision(revision)
    onBoardSelected(generation)
  }

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }}>
      <InputLabel>{t("board")}</InputLabel>
      <Select label={t("selectYourBoard")}>
        {Object.keys(BoardGeneration).map((generation, i) => (
          <MenuItem
            key={generation.toLowerCase()}
            value={generation.toLowerCase()}
            onClick={() => getFirmwareForRevision((i + 1) * 1000)}
          >
            {generation}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
