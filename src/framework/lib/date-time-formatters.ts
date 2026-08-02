import { parse, format, parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Europe/Bucharest"

export const formatTime = (timeString?: string) => {
  if (!timeString) return ""
  const parsed = parse(timeString, "HH:mm:ss", new Date())
  return format(parsed, "HH:mm:ss")
}

export const formatDate = (value: string | null) => {
  if (!value) return ""
  return format(parseISO(value), "dd-MM-yyyy")
}

export const formatDateTime = (value: string | null) => {
  if (!value) return ""
  return formatInTimeZone(parseISO(value as string), TZ, "dd-MM-yyyy HH:mm:ss")
}
