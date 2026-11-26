import { createId } from '#/features/catalog/createId'
import type { Place, Trip, TripItem } from '#/features/catalog/types'
import { todayIso } from '#/features/catalog/isoDate'

export function toggleComplete(trip: Trip, itemId: string): Trip {
  return mapItem(trip, itemId, (item) => ({ ...item, completed: !item.completed }))
}

export function removeItem(trip: Trip, itemId: string): Trip {
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      items: day.items.filter((item) => item.id !== itemId),
    })),
  }
}

export function moveItem(trip: Trip, itemId: string, direction: 'up' | 'down'): Trip {
  return {
    ...trip,
    days: trip.days.map((day) => {
      const index = day.items.findIndex((item) => item.id === itemId)
      if (index < 0) return day
      const swapWith = direction === 'up' ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= day.items.length) return day
      const items = [...day.items]
      const current = items[index]
      items[index] = items[swapWith]
      items[swapWith] = current
      return { ...day, items }
    }),
  }
}

export function addPlaceToDay(trip: Trip, dayIndex: number, place: Place): Trip {
  return {
    ...trip,
    days: trip.days.map((day) => {
      if (day.dayIndex !== dayIndex) return day
      if (day.items.some((item) => item.placeId === place.id)) return day
      const startTime = day.items.some((item) => item.startTime === '09:00') ? '18:00' : '09:00'
      const item: TripItem = {
        id: createId(),
        placeId: place.id,
        startTime,
        durationMinutes: place.durationMinutes,
        completed: false,
      }
      return { ...day, items: [...day.items, item] }
    }),
  }
}

export function addPlaceToTripDayOne(trip: Trip, place: Place): Trip {
  const days =
    trip.days.length === 0
      ? [{ dayIndex: 1, date: trip.startDate, items: [] as TripItem[] }]
      : trip.days
  return addPlaceToDay({ ...trip, days }, 1, place)
}

export function saveTripStatus(trip: Trip, today = todayIso()): Trip {
  return {
    ...trip,
    status: trip.endDate >= today ? 'upcoming' : 'past',
  }
}

function mapItem(trip: Trip, itemId: string, update: (item: TripItem) => TripItem): Trip {
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      items: day.items.map((item) => (item.id === itemId ? update(item) : item)),
    })),
  }
}
