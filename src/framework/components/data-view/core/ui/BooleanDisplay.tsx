interface BooleanDisplayProps {
  value: boolean
  title?: string
}
const BooleanDisplay = ({ value, title }: BooleanDisplayProps) => {
  return <span title={title}>{value ? "Yes" : "No"}</span>
}

export default BooleanDisplay
