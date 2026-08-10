import { useTranslations } from "next-intl"

interface BooleanDisplayProps {
  value: boolean
  title?: string
}
const BooleanDisplay = ({ value, title }: BooleanDisplayProps) => {
  const t = useTranslations("Common")
  return <span title={title}>{value ? t("yes") : t("no")}</span>
}

export default BooleanDisplay
