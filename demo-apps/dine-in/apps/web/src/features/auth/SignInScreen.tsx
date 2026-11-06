import { strings } from '#/generated/strings'
import { AuthForm } from './AuthForm'
import { useSignInViewModel } from './useAuthFormViewModel'

export function SignInScreen() {
  const viewModel = useSignInViewModel()
  return (
    <AuthForm
      viewModel={viewModel}
      title={strings.authSignInTitle}
      subtitle={strings.authSignInSubtitle}
      action={strings.authSignInAction}
      switchLabel={strings.authSwitchToSignUp}
      switchTo="/sign-up"
      newPassword={false}
    />
  )
}
