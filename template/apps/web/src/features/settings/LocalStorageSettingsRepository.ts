import { APPEARANCE_STORAGE_KEY, parseAppearance, type Appearance } from './Appearance'
import type { SettingsRepository } from './SettingsRepository'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Keeps settings in the browser's localStorage. Without storage (during server rendering) it returns defaults. */
export class LocalStorageSettingsRepository implements SettingsRepository {
  private readonly storage: KeyValueStorage | undefined

  constructor(storage: KeyValueStorage | undefined) {
    this.storage = storage
  }

  async getAppearance(): Promise<Appearance> {
    return parseAppearance(this.storage?.getItem(APPEARANCE_STORAGE_KEY))
  }

  async setAppearance(appearance: Appearance): Promise<void> {
    this.storage?.setItem(APPEARANCE_STORAGE_KEY, appearance)
  }
}
