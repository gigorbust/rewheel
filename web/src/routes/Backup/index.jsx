import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ConnectionManager } from "../../components/ConnectionManager"
import { Backup } from "./Backup"
import { FirmwareConfirmation } from "./FirmwareConfirmation"

export const BackupPage = () => {
  const { t } = useTranslation("backup")
  const [validOTA, setValidOTA] = useState(false)

  return (
    <>
      {!validOTA && (
        <FirmwareConfirmation onHasValidOTA={() => setValidOTA(true)} />
      )}
      {validOTA && (
        <ConnectionManager
          title={t("title")}
          subheader={t("disconnectedSubheader")}
        >
          <Backup />
        </ConnectionManager>
      )}
    </>
  )
}
