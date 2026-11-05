import SwiftUI

struct SignUpScreen: View {
    @State private var viewModel: AuthViewModel
    let onSwitch: () -> Void

    init(viewModel: AuthViewModel, onSwitch: @escaping () -> Void) {
        _viewModel = State(initialValue: viewModel)
        self.onSwitch = onSwitch
    }

    var body: some View {
        AuthForm(
            viewModel: viewModel,
            title: Strings.authSignUpTitle,
            subtitle: Strings.authSignUpSubtitle,
            submitTitle: Strings.authSignUpAction,
            switchTitle: Strings.authSwitchToSignIn,
            onSwitch: onSwitch
        )
    }
}

#Preview {
    SignUpScreen(viewModel: AuthViewModel(mode: .signUp, repository: InMemoryAuthRepository()) { _ in }) {}
}
