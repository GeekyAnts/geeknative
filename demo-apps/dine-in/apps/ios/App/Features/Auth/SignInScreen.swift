import SwiftUI

/// The shared layout of Sign in and Sign up.
struct AuthForm: View {
    @Bindable var viewModel: AuthViewModel
    let title: String
    let subtitle: String
    let submitTitle: String
    let switchTitle: String
    let onSwitch: () -> Void

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.xl) {
                    ScreenHeader(title: title, subtitle: subtitle)
                        .reveal(0)
                    fields.reveal(1)
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        if let formError = viewModel.formError {
                            Text(formError)
                                .font(AppTypography.label)
                                .foregroundStyle(AppColors.error)
                                .accessibilityIdentifier("auth.error")
                                .transition(.opacity)
                        }
                        PrimaryButton(title: submitTitle, isBusy: viewModel.isSubmitting) {
                            Task { await viewModel.submit() }
                        }
                        .accessibilityIdentifier("auth.submit")
                        Button(action: onSwitch) {
                            Text(switchTitle)
                                .font(AppTypography.label)
                                .foregroundStyle(AppColors.primary)
                                .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget)
                        }
                        .accessibilityIdentifier("auth.switch")
                    }
                    .reveal(2)
                    DemoNote(text: Strings.authLocalNote)
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.top, AppSize.touchTarget + AppSpacing.xl)
                .padding(.bottom, AppSpacing.xxl)
                .animation(AppMotion.standard(AppMotion.fast), value: viewModel.formError)
            }
            .scrollDismissesKeyboard(.interactively)
            TopBar()
        }
        .background(AppColors.background.ignoresSafeArea())
        .disabled(viewModel.isSubmitting)
    }

    private var fields: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            if viewModel.mode == .signUp {
                AppTextField(
                    icon: AppIcon.user, placeholder: Strings.authName, text: $viewModel.name,
                    error: viewModel.nameError, contentType: .name, capitalization: .words, testID: "auth.name"
                )
            }
            AppTextField(
                icon: AppIcon.mail, placeholder: Strings.authEmail, text: $viewModel.email,
                error: viewModel.emailError, contentType: .emailAddress, keyboard: .emailAddress, testID: "auth.email"
            )
            AppTextField(
                icon: AppIcon.lock, placeholder: Strings.authPassword, text: $viewModel.password,
                error: viewModel.passwordError, isSecure: true,
                contentType: viewModel.mode == .signUp ? .newPassword : .password, testID: "auth.password",
                hint: viewModel.mode == .signUp ? Strings.authPasswordHint : nil
            )
        }
    }
}

struct SignInScreen: View {
    @State private var viewModel: AuthViewModel
    let onSwitch: () -> Void

    init(viewModel: AuthViewModel, onSwitch: @escaping () -> Void) {
        _viewModel = State(initialValue: viewModel)
        self.onSwitch = onSwitch
    }

    var body: some View {
        AuthForm(
            viewModel: viewModel,
            title: Strings.authSignInTitle,
            subtitle: Strings.authSignInSubtitle,
            submitTitle: Strings.authSignInAction,
            switchTitle: Strings.authSwitchToSignUp,
            onSwitch: onSwitch
        )
    }
}

#Preview {
    SignInScreen(viewModel: AuthViewModel(mode: .signIn, repository: InMemoryAuthRepository()) { _ in }) {}
}
