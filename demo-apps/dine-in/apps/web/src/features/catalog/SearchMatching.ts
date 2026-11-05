/** Lowercased, with diacritics removed (`Kōyō` → `koyo`). */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/** Whether `text` contains `query`, ignoring case and diacritics. An empty query matches everything. */
export function matches(text: string, query: string): boolean {
  const folded = fold(query.trim())
  return folded === '' || fold(text).includes(folded)
}
