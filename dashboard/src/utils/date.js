const TZ = "Australia/Melbourne"
const LOCALE = "en-AU"

export function formatDate(value) {
  if (!value) return ""
  return new Date(value).toLocaleDateString(LOCALE, {
    day: "numeric", month: "short", year: "numeric", timeZone: TZ,
  })
}

export function formatDateTime(value) {
  if (!value) return ""
  return new Date(value).toLocaleString(LOCALE, {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ,
  })
}

export function formatTime(value) {
  if (!value) return ""
  return new Date(value).toLocaleTimeString(LOCALE, {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ,
  })
}

export function formatDateShort(value) {
  if (!value) return ""
  return new Date(value).toLocaleDateString(LOCALE, {
    day: "numeric", month: "short", timeZone: TZ,
  })
}

export function formatMonthYear(value) {
  if (!value) return ""
  return new Date(value).toLocaleDateString(LOCALE, {
    month: "short", year: "2-digit", timeZone: TZ,
  })
}
