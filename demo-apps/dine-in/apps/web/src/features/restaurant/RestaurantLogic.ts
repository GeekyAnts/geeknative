import { weekdays, type Restaurant, type Weekday } from '#/features/catalog/Catalog'
import { Formatters } from '#/features/catalog/Formatters'
import { isoDate, weekdayOf } from '#/features/catalog/LocalDate'
import { strings } from '#/generated/strings'

export const MAP_ZOOM = 16

export interface MapTile {
  url: string
  /** The restaurant's position inside the tile, 0…1 from the top-left. */
  fractionX: number
  fractionY: number
}

/** The OpenStreetMap tile at zoom 16 containing a coordinate (spec/features/restaurant.md). */
export function mapTile(latitude: number, longitude: number): MapTile {
  const scale = 2 ** MAP_ZOOM
  const latRad = (latitude * Math.PI) / 180
  const x = ((longitude + 180) / 360) * scale
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale
  const tileX = Math.floor(x)
  const tileY = Math.floor(y)
  return {
    url: `https://tile.openstreetmap.org/${MAP_ZOOM}/${tileX}/${tileY}.png`,
    fractionX: x - tileX,
    fractionY: y - tileY,
  }
}

/**
 * The tile is a square as wide as the card (`100cqw`), shifted up so the restaurant sits as close to
 * the card's vertical centre as the tile allows.
 */
const cardHeight = 'var(--spacing-list-image-height)'
const tileTop = (tile: MapTile) => `clamp(calc(${cardHeight} - 100cqw), calc(${cardHeight} / 2 - ${tile.fractionY} * 100cqw), 0px)`

export const mapImageStyle = (tile: MapTile) => ({ top: tileTop(tile) })

export const mapPinStyle = (tile: MapTile) => ({
  left: `${tile.fractionX * 100}%`,
  top: `calc(${tileTop(tile)} + ${tile.fractionY} * 100cqw)`,
})

export const weekdayName: Record<Weekday, string> = {
  mon: strings.dateWeekdayMon,
  tue: strings.dateWeekdayTue,
  wed: strings.dateWeekdayWed,
  thu: strings.dateWeekdayThu,
  fri: strings.dateWeekdayFri,
  sat: strings.dateWeekdaySat,
  sun: strings.dateWeekdaySun,
}

export interface OpeningHoursRow {
  day: Weekday
  name: string
  hours: string
  closed: boolean
  today: boolean
}

/** Seven rows Monday→Sunday; closed days read "Closed"; today's row is flagged. */
export function openingHoursRows(restaurant: Restaurant, now: Date): OpeningHoursRow[] {
  const today = weekdayOf(isoDate(now))
  return weekdays.map((day) => {
    const period = restaurant.openingHours[day]
    return {
      day,
      name: weekdayName[day],
      hours: period ? Formatters.timeRange(period.open, period.close) : strings.restaurantClosed,
      closed: period === null,
      today: day === today,
    }
  })
}
