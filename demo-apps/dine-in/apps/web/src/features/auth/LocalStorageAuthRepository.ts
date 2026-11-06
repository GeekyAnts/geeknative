import { readJson, type KeyValueStorage } from '#/core/KeyValueStorage'
import {
  ACCOUNTS_STORAGE_KEY,
  AuthError,
  SESSION_STORAGE_KEY,
  normalizeEmail,
  passwordHash,
  type Account,
  type StoredAccount,
} from './Account'
import type { AuthRepository } from './AuthRepository'

const publicAccount = ({ name, email, createdAt }: StoredAccount): Account => ({ name, email, createdAt })

/**
 * Accounts under `auth.accounts` (SHA-256 password hashes) and the session under `auth.session`, in
 * localStorage. Without storage (during server rendering) there is no session.
 */
export class LocalStorageAuthRepository implements AuthRepository {
  private readonly storage: KeyValueStorage | undefined
  private readonly now: () => Date

  constructor(storage: KeyValueStorage | undefined, now: () => Date = () => new Date()) {
    this.storage = storage
    this.now = now
  }

  private accounts(): StoredAccount[] {
    const value = readJson(this.storage, ACCOUNTS_STORAGE_KEY)
    return Array.isArray(value) ? (value as StoredAccount[]) : []
  }

  /** The signed-in member's email, if any. */
  sessionEmail(): string | null {
    return this.storage?.getItem(SESSION_STORAGE_KEY) ?? null
  }

  async currentAccount(): Promise<Account | null> {
    const email = this.sessionEmail()
    const account = email ? this.accounts().find((a) => a.email === email) : undefined
    return account ? publicAccount(account) : null
  }

  async signUp(name: string, email: string, password: string): Promise<Account> {
    const normalized = normalizeEmail(email)
    const accounts = this.accounts()
    if (accounts.some((a) => a.email === normalized)) throw new AuthError('emailTaken')
    const account: StoredAccount = {
      name: name.trim(),
      email: normalized,
      passwordHash: await passwordHash(normalized, password),
      createdAt: this.now().toISOString(),
    }
    this.storage?.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([...accounts, account]))
    this.storage?.setItem(SESSION_STORAGE_KEY, normalized)
    return publicAccount(account)
  }

  async signIn(email: string, password: string): Promise<Account> {
    const normalized = normalizeEmail(email)
    const account = this.accounts().find((a) => a.email === normalized)
    if (!account || account.passwordHash !== (await passwordHash(normalized, password))) throw new AuthError('invalidCredentials')
    this.storage?.setItem(SESSION_STORAGE_KEY, normalized)
    return publicAccount(account)
  }

  async signOut(): Promise<void> {
    this.storage?.removeItem(SESSION_STORAGE_KEY)
  }
}
