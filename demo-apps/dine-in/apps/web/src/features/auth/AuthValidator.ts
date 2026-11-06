import { strings } from '#/generated/strings'

export interface AuthFieldErrors {
  name?: string
  email?: string
  password?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_PASSWORD_LENGTH = 8

/** Field validation for Sign in and Sign up. `name` is checked only when given (Sign up). */
export const AuthValidator = {
  validate(fields: { name?: string; email: string; password: string }): AuthFieldErrors {
    const errors: AuthFieldErrors = {}
    if (fields.name !== undefined && fields.name.trim() === '') errors.name = strings.authErrorNameRequired
    if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = strings.authErrorEmailInvalid
    if (fields.password.length < MIN_PASSWORD_LENGTH) errors.password = strings.authErrorPasswordShort
    return errors
  },
}
