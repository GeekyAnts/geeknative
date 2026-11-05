import { useSyncExternalStore } from 'react'

const subscribeToNothing = () => () => {}

/** False while the page is rendering on the server and hydrating, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false)
}
