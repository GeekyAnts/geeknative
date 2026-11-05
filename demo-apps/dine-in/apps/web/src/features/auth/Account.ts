/** The signed-in member. */
export interface Account {
  name: string
  email: string
  /** ISO 8601 UTC */
  createdAt: string
}

/** As stored under `auth.accounts`. */
export interface StoredAccount extends Account {
  passwordHash: string
}

export const ACCOUNTS_STORAGE_KEY = 'auth.accounts'
export const SESSION_STORAGE_KEY = 'auth.session'

export type AuthErrorCode = 'emailTaken' | 'invalidCredentials'

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.code = code
  }
}

/** Emails are stored trimmed and lowercased; comparisons use that form. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase()

/** Lowercase hex SHA-256 of the UTF-8 string "<email>:<password>". */
export async function passwordHash(email: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${email}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** First letter of the first and last words of the name, uppercased (one letter for a one-word name). */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

/** The text before the first space of the name. */
export const firstName = (name: string) => name.trim().split(' ')[0] ?? ''
