import { strings } from '#/generated/strings'
import { taskIds, type BookingStatus, type TaskId, type WeddingStyle } from './types'

export function styleLabel(style: WeddingStyle): string {
  switch (style) {
    case 'beach':
      return strings.styleBeach
    case 'royal':
      return strings.styleRoyal
    case 'garden':
      return strings.styleGarden
    case 'mountain':
      return strings.styleMountain
    case 'heritage':
      return strings.styleHeritage
    case 'luxuryResort':
      return strings.styleLuxuryResort
  }
}

export function bookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'none':
      return strings.weddingStatusNone
    case 'enquirySent':
      return strings.weddingStatusEnquirySent
    case 'confirmed':
      return strings.weddingStatusConfirmed
  }
}

export function taskLabel(id: TaskId): string {
  switch (id) {
    case 'venue':
      return strings.weddingTaskVenue
    case 'guests':
      return strings.weddingTaskGuests
    case 'attire':
      return strings.weddingTaskAttire
    case 'photography':
      return strings.weddingTaskPhotography
    case 'catering':
      return strings.weddingTaskCatering
    case 'decor':
      return strings.weddingTaskDecor
    case 'invitations':
      return strings.weddingTaskInvitations
    case 'travel':
      return strings.weddingTaskTravel
    case 'ceremony':
      return strings.weddingTaskCeremony
    case 'reception':
      return strings.weddingTaskReception
  }
}

export const allTasks = [...taskIds]
