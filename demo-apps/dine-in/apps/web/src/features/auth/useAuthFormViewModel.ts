import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { strings } from '#/generated/strings'
import { AuthError, type Account } from './Account'
import { AuthValidator, type AuthFieldErrors } from './AuthValidator'
import { sessionQuery } from './useSession'

type Mode = 'signIn' | 'signUp'

/** Shared state for Sign in and Sign up: fields, errors after the first submit, busy, and a form-level error. */
function useAuthFormViewModel(mode: Mode) {
  const { container } = useRouteContext({ from: '__root__' })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fields = { name: mode === 'signUp' ? name : undefined, email, password }
  const errors: AuthFieldErrors = attempted ? AuthValidator.validate(fields) : {}

  const submit = async () => {
    setAttempted(true)
    setFormError(null)
    if (Object.keys(AuthValidator.validate(fields)).length > 0) return
    setBusy(true)
    try {
      const account: Account =
        mode === 'signUp'
          ? await container.authRepository.signUp(name, email, password)
          : await container.authRepository.signIn(email, password)
      queryClient.setQueryData(sessionQuery(container.authRepository).queryKey, account)
      await navigate({ to: '/', replace: true })
    } catch (error) {
      setFormError(
        error instanceof AuthError && error.code === 'emailTaken'
          ? strings.authErrorEmailTaken
          : error instanceof AuthError
            ? strings.authErrorInvalidCredentials
            : strings.commonErrorBody,
      )
      setBusy(false)
    }
  }

  return {
    name,
    email,
    password,
    showPassword,
    errors,
    busy,
    formError,
    setName,
    setEmail,
    setPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    submit,
  }
}

export const useSignInViewModel = () => useAuthFormViewModel('signIn')
export const useSignUpViewModel = () => useAuthFormViewModel('signUp')
