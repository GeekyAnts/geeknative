import { useEffect } from 'react'
import { APPEARANCE_STORAGE_KEY, isDark } from '#/features/settings/Appearance'
import { useAppearance } from '#/features/settings/useSettingsViewModel'

/**
 * Runs in <head> before the first paint: applies the stored appearance (unknown or missing
 * values count as "system"), so the page never flashes the wrong theme.
 */
export const appearanceScript = `(() => {
  try {
    const stored = localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)})
    const dark = stored === 'dark' || (stored !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  } catch {}
})()`

/** Keeps the "dark" class on <html> in step with the chosen appearance and the system setting. */
export function AppearanceEffect() {
  const { data: appearance } = useAppearance()

  useEffect(() => {
    if (!appearance) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', isDark(appearance, media.matches))
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [appearance])

  return null
}
