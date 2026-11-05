import { memoryStorage } from '#/core/KeyValueStorage'
import { ACCOUNTS_STORAGE_KEY, SESSION_STORAGE_KEY, normalizeEmail, type StoredAccount } from './Account'
import { LocalStorageAuthRepository } from './LocalStorageAuthRepository'

/** Accounts held in memory, for tests and previews. Optionally starts with a signed-in member. */
export class InMemoryAuthRepository extends LocalStorageAuthRepository {
  constructor(options: { accounts?: StoredAccount[]; signedIn?: string; now?: () => Date } = {}) {
    const initial: Record<string, string> = { [ACCOUNTS_STORAGE_KEY]: JSON.stringify(options.accounts ?? []) }
    if (options.signedIn) initial[SESSION_STORAGE_KEY] = normalizeEmail(options.signedIn)
    super(memoryStorage(initial), options.now)
  }
}
