import { createFileRoute } from '@tanstack/react-router'
import { SignInScreen } from '#/features/auth/SignInScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/sign-in')({
  head: () => ({ meta: [{ title: `${strings.authSignInAction} · ${AppIdentity.name}` }] }),
  component: SignInScreen,
})
