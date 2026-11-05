import { strings } from '#/generated/strings'
import { parseIsoDate } from './LocalDate'

/** Dates, times, prices and ratings built from contracts/strings, so all three apps print identical text. */

const weekdayShort = () => [
  strings.dateWeekdayShortSun,
  strings.dateWeekdayShortMon,
  strings.dateWeekdayShortTue,
  strings.dateWeekdayShortWed,
  strings.dateWeekdayShortThu,
  strings.dateWeekdayShortFri,
  strings.dateWeekdayShortSat,
]
const weekdayLong = () => [
  strings.dateWeekdaySun,
  strings.dateWeekdayMon,
  strings.dateWeekdayTue,
  strings.dateWeekdayWed,
  strings.dateWeekdayThu,
  strings.dateWeekdayFri,
  strings.dateWeekdaySat,
]
const monthShort = () => [
  strings.dateMonthShortJan,
  strings.dateMonthShortFeb,
  strings.dateMonthShortMar,
  strings.dateMonthShortApr,
  strings.dateMonthShortMay,
  strings.dateMonthShortJun,
  strings.dateMonthShortJul,
  strings.dateMonthShortAug,
  strings.dateMonthShortSep,
  strings.dateMonthShortOct,
  strings.dateMonthShortNov,
  strings.dateMonthShortDec,
]
const monthLong = () => [
  strings.dateMonthJan,
  strings.dateMonthFeb,
  strings.dateMonthMar,
  strings.dateMonthApr,
  strings.dateMonthMay,
  strings.dateMonthJun,
  strings.dateMonthJul,
  strings.dateMonthAug,
  strings.dateMonthSep,
  strings.dateMonthOct,
  strings.dateMonthNov,
  strings.dateMonthDec,
]

const asDate = (date: string | Date) => (typeof date === 'string' ? parseIsoDate(date) : date)

/** Indian digit grouping: the last three digits, then pairs (125000 → "1,25,000"). */
function groupIndian(amount: number): string {
  const digits = String(Math.round(Math.abs(amount)))
  if (digits.length <= 3) return digits
  const head = digits.slice(0, -3)
  const tail = digits.slice(-3)
  return `${head.replace(/\B(?=(\d{2})+$)/g, ',')},${tail}`
}

export const Formatters = {
  /** "Fri, 20 Nov" */
  dateShort(date: string | Date): string {
    const value = asDate(date)
    return strings.formatDateShort({ weekday: weekdayShort()[value.getDay()], day: value.getDate(), month: monthShort()[value.getMonth()] })
  },
  /** "Friday, 20 November 2026" */
  dateLong(date: string | Date): string {
    const value = asDate(date)
    return strings.formatDateLong({
      weekday: weekdayLong()[value.getDay()],
      day: value.getDate(),
      month: monthLong()[value.getMonth()],
      year: value.getFullYear(),
    })
  },
  /** "November 2026" */
  monthYear(date: string | Date): string {
    const value = asDate(date)
    return strings.formatMonthYear({ month: monthLong()[value.getMonth()], year: value.getFullYear() })
  },
  /** The short weekday of a date ("Fri"). */
  weekdayShort(date: string | Date): string {
    return weekdayShort()[asDate(date).getDay()]
  },
  /** "7:30 PM" from "19:30"; "12:00 AM" from "00:00". */
  time(time: string): string {
    const [hours, minutes] = time.split(':').map(Number)
    return strings.formatTime({
      hour: hours % 12 === 0 ? 12 : hours % 12,
      minute: String(minutes).padStart(2, '0'),
      period: hours < 12 ? strings.formatAm : strings.formatPm,
    })
  },
  timeRange(open: string, close: string): string {
    return strings.formatTimeRange({ start: Formatters.time(open), end: Formatters.time(close) })
  },
  /** "₹2,400" */
  price(amount: number): string {
    return strings.formatPrice({ amount: groupIndian(amount) })
  },
  /** "₹" */
  priceSymbol(): string {
    return strings.formatPrice({ amount: '' })
  },
  /** "4.9", "5.0" */
  rating(rating: number): string {
    return rating.toFixed(1)
  },
  /** "1.2 km" */
  distance(km: number): string {
    return strings.restaurantDistance({ distance: km.toFixed(1) })
  },
  separator(first: string, second: string): string {
    return strings.formatSeparator({ first, second })
  },
}
