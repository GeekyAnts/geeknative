import { isSavedKind, type SavedItem } from '#/features/catalog/types'

export const SAVED_STORAGE_KEY = 'saved.items'

export function parseSaved(value: string | null | undefined): SavedItem[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const items: SavedItem[] = []
    for (const entry of parsed) {
      if (!isSavedItem(entry) || seen.has(entry.id)) continue
      seen.add(entry.id)
      items.push({ id: entry.id, kind: entry.kind })
    }
    return items
  } catch {
    return []
  }
}

function isSavedItem(value: unknown): value is SavedItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as { id?: unknown; kind?: unknown }
  return typeof item.id === 'string' && isSavedKind(item.kind)
}

export function toggleSaved(items: SavedItem[], item: SavedItem): SavedItem[] {
  if (items.some((saved) => saved.id === item.id)) {
    return items.filter((saved) => saved.id !== item.id)
  }
  return [{ id: item.id, kind: item.kind }, ...items]
}
