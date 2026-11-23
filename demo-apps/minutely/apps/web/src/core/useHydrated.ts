import { useSyncExternalStore } from 'react'

const subscribeToNothing = () => () => {}

/**
 * False while the page is rendering on the server and hydrating, true afterwards.
 * Data that lives in localStorage must wait for it, so the first client render matches the server's HTML.
 */
export function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false)
}
