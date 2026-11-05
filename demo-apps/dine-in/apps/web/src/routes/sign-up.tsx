import { createFileRoute } from '@tanstack/react-router'
import { SignUpScreen } from '#/features/auth/SignUpScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/sign-up')({
  head: () => ({ meta: [{ title: `${strings.authSignUpAction} · ${AppIdentity.name}` }] }),
  component: SignUpScreen,
})
