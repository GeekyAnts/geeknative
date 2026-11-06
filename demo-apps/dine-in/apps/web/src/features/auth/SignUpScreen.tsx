import { TextField } from '#/core/designsystem/TextField'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { AuthForm } from './AuthForm'
import { useSignUpViewModel } from './useAuthFormViewModel'

export function SignUpScreen() {
  const viewModel = useSignUpViewModel()
  return (
    <AuthForm
      viewModel={viewModel}
      title={strings.authSignUpTitle}
      subtitle={strings.authSignUpSubtitle}
      action={strings.authSignUpAction}
      switchLabel={strings.authSwitchToSignIn}
      switchTo="/sign-in"
      newPassword
      passwordHint={strings.authPasswordHint}
      nameField={
        <TextField
          label={strings.authName}
          icon={AppIcons.user}
          autoComplete="name"
          autoCapitalize="words"
          value={viewModel.name}
          onChange={(event) => viewModel.setName(event.target.value)}
          error={viewModel.errors.name}
          disabled={viewModel.busy}
          testId="auth.name"
        />
      }
    />
  )
}
