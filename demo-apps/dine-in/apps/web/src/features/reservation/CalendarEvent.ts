import type { Restaurant } from '#/features/catalog/Catalog'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'
import { reservationDateTime, type Reservation } from '#/features/reservations/Reservation'

export const EVENT_DURATION_HOURS = 2

export interface CalendarEvent {
  uid: string
  title: string
  start: Date
  end: Date
  location: string
  notes: string
}

/** The calendar event for a reservation: 2 hours from its local date and time. */
export function calendarEvent(reservation: Reservation, restaurant: Restaurant): CalendarEvent {
  const start = reservationDateTime(reservation)
  const end = new Date(start)
  end.setHours(end.getHours() + EVENT_DURATION_HOURS)
  return {
    uid: reservation.id,
    title: strings.calendarEventTitle({ restaurant: restaurant.name }),
    start,
    end,
    location: restaurant.address,
    notes: strings.calendarEventNotes({ code: reservation.confirmationCode }),
  }
}

const pad = (value: number) => String(value).padStart(2, '0')

/** Floating local time: 20261120T193000. */
const localStamp = (date: Date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`

const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

/** An iCalendar (RFC 5545) file with one event, as downloaded by "Add to calendar". */
export function icsFile(event: CalendarEvent, now: Date): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${AppIdentity.name}//${AppIdentity.id}//EN`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${localStamp(event.start)}`,
    `DTEND:${localStamp(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(event.notes)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export const icsFileName = (reservation: Reservation) => `${reservation.confirmationCode}.ics`

/** Downloads `<confirmationCode>.ics` in the browser. */
export function downloadCalendarFile(reservation: Reservation, restaurant: Restaurant, now: Date) {
  const blob = new Blob([icsFile(calendarEvent(reservation, restaurant), now)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = icsFileName(reservation)
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Google Maps directions to the restaurant, opened in a new tab. */
export const directionsUrl = (restaurant: Restaurant) =>
  `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`

/** The dialer, with spaces removed from the number. */
export const telUrl = (phone: string) => `tel:${phone.replace(/\s+/g, '')}`
