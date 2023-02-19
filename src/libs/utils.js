import { format, parse } from "date-fns"

let dateFormat

export function setDateFormat(val) {
  dateFormat = val
}

export function tagListFromCategories(categories) {
  if (categories == null) return "未知"
  return categories.map(({ title }) => `[[${title}]]`).join("，")
}

export function toTagList(str) {
  if (!str) return "未知"
  return str
    .split(/[,， ]/)
    .map((t) => `[[${t.trim()}]]`)
    .join("，")
}

export function toTag(str) {
  if (!str) return "未知"
  return `[[${str}]]`
}

export function toLSDate(str) {
  if (!str) return "未知"
  const refDate = new Date()
  const date = parse(str, "yyyy-MM-dd HH:mm:ss", refDate)
  return `[[${format(date, dateFormat)}]]`
}

export function toLSDateFromTS(ts) {
  const date = new Date(ts * 1000)
  return `[[${format(date, dateFormat)}]]`
}

export function parseRange(str) {
  return str.split("-").map((s) => +s)
}
