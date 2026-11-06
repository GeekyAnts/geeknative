/** The part of localStorage the repositories use. Absent during server rendering. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** A Map-backed storage, for tests and previews. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { dump(): Record<string, string> } {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
    dump: () => Object.fromEntries(values),
  }
}

/** Reads JSON from storage, or undefined when missing or invalid. */
export function readJson(storage: KeyValueStorage | undefined, key: string): unknown {
  const text = storage?.getItem(key)
  if (text == null) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
