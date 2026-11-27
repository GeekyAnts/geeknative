import type { AppNotification } from './Notification'
import type { NotificationScheduler } from './LocalNotificationsRepository'

const timers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Shows a browser notification only while this tab is in the background, so an open page
 * does not also raise a system banner. A click focuses this tab and opens the row's route.
 */
export const browserNotifications: NotificationScheduler = {
  schedule(notification) {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    cancel(notification.id)
    const fire = () => show(notification)
    if (!notification.deliverAt) {
      fire()
      return
    }
    const delay = Date.parse(notification.deliverAt) - Date.now()
    if (Number.isNaN(delay) || delay <= 500) fire()
    else timers.set(notification.id, setTimeout(fire, delay))
  },
  cancel,
  cancelAll() {
    for (const id of [...timers.keys()]) cancel(id)
  },
}

function cancel(id: string) {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
}

function show(notification: AppNotification) {
  // The page is already open. The inbox is enough; a banner would be a second notice.
  if (document.visibilityState === 'visible') return
  const posted = new Notification(notification.title, { body: notification.body, tag: notification.id })
  posted.onclick = () => {
    window.focus()
    const route = notification.route === 'settings' ? '/settings' : '/'
    window.location.assign(route)
    posted.close()
  }
}
