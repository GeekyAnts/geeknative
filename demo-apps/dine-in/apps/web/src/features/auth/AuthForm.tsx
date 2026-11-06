import { Link } from '@tanstack/react-router'
import type { FormEvent, ReactNode } from 'react'
import { DemoNote } from '#/core/designsystem/DemoNote'
import { GlassSurface } from '#/core/designsystem/GlassSurface'
import { Page } from '#/core/designsystem/Page'
import { PrimaryButton } from '#/core/designsystem/PrimaryButton'
import { ScreenHeader } from '#/core/designsystem/ScreenHeader'
import { TextField } from '#/core/designsystem/TextField'
import { TopBar } from '#/core/designsystem/TopBar'
import { focusRing } from '#/core/designsystem/Buttons'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import type { useSignInViewModel } from './useAuthFormViewModel'

type ViewModel = ReturnType<typeof useSignInViewModel>

/** The layout Sign in and Sign up share. */
export function AuthForm({
  viewModel,
  title,
  subtitle,
  action,
  switchLabel,
  switchTo,
  newPassword,
  nameField,
  passwordHint,
}: {
  viewModel: ViewModel
  title: string
  subtitle: string
  action: string
  switchLabel: string
  switchTo: '/sign-in' | '/sign-up'
  newPassword: boolean
  nameField?: ReactNode
  passwordHint?: string
}) {
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void viewModel.submit()
  }

  return (
    <div className="min-h-dvh">
      <TopBar fallback="/welcome" />
      <main>
        <Page width="form" className="pt-md">
          <GlassSurface floating className="flex flex-col gap-xl rounded-xl p-xl">
            <ScreenHeader title={title} subtitle={subtitle} />
            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-lg motion-safe:animate-fade-up">
              {nameField}
            <TextField
              label={strings.authEmail}
              icon={AppIcons.mail}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={viewModel.email}
              onChange={(event) => viewModel.setEmail(event.target.value)}
              error={viewModel.errors.email}
              disabled={viewModel.busy}
              testId="auth.email"
            />
            <TextField
              label={strings.authPassword}
              icon={AppIcons.lock}
              type={viewModel.showPassword ? 'text' : 'password'}
              autoComplete={newPassword ? 'new-password' : 'current-password'}
              value={viewModel.password}
              onChange={(event) => viewModel.setPassword(event.target.value)}
              error={viewModel.errors.password}
              hint={passwordHint}
              disabled={viewModel.busy}
              testId="auth.password"
              trailing={
                <button
                  type="button"
                  data-testid="auth.togglePassword"
                  aria-label={viewModel.showPassword ? strings.authHidePassword : strings.authShowPassword}
                  aria-pressed={viewModel.showPassword}
                  onClick={viewModel.toggleShowPassword}
                  className={`-me-sm inline-flex size-touch-target items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface ${focusRing}`}
                >
                  {viewModel.showPassword ? <AppIcons.eyeOff className="size-icon-md" /> : <AppIcons.eye className="size-icon-md" />}
                </button>
              }
            />
            {viewModel.formError && (
              <p role="alert" data-testid="auth.error" className="rounded-md bg-error/10 p-md text-label text-error">
                {viewModel.formError}
              </p>
            )}
            <PrimaryButton type="submit" busy={viewModel.busy} testId="auth.submit" className="w-full">
              {action}
            </PrimaryButton>
            <Link
              to={switchTo}
              replace
              data-testid="auth.switch"
              className={`inline-flex min-h-touch-target items-center justify-center rounded-full text-label text-primary hover:underline ${focusRing}`}
            >
              {switchLabel}
            </Link>
          </form>
          <DemoNote text={strings.authLocalNote} />
          </GlassSurface>
        </Page>
      </main>
    </div>
  )
}
