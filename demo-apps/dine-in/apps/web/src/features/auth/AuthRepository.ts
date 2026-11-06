import type { Account } from './Account'

/** Accounts and the session. A backend with real authentication replaces the implementation later. */
export interface AuthRepository {
  currentAccount(): Promise<Account | null>
  /** Throws `AuthError('emailTaken')`. Creating an account signs the member in. */
  signUp(name: string, email: string, password: string): Promise<Account>
  /** Throws `AuthError('invalidCredentials')`. */
  signIn(email: string, password: string): Promise<Account>
  signOut(): Promise<void>
}
