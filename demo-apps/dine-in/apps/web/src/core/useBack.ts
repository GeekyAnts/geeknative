import { useCanGoBack, useRouter } from '@tanstack/react-router'

/** Goes back in history, or to `fallback` when the screen was opened directly. */
export function useBack(fallback: string = '/') {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return () => {
    if (canGoBack) router.history.back()
    else void router.navigate({ to: fallback, replace: true })
  }
}
