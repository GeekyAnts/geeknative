import SwiftUI
import UIKit

/// The navigation root: the signed-out stack (Welcome) or the signed-in stack (the tabs). Also
/// applies the chosen appearance to every window.
struct RootView: View {
    @Environment(AppContainer.self) private var container
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            AppColors.background.ignoresSafeArea()
            if let session = container.session {
                SignedInRoot(session: session)
                    .id(session.account.email)
                    .transition(.opacity)
            } else {
                SignedOutRoot()
                    .transition(.opacity)
            }
        }
        .animation(AppMotion.reduced(AppMotion.standard(AppMotion.slow), reduceMotion), value: container.session?.account.email)
        .onChange(of: container.settingsRepository.appearance, initial: true) { _, appearance in
            apply(appearance)
        }
    }

    /// Overrides the style on the windows themselves, so sheets and alerts follow too.
    private func apply(_ appearance: Appearance) {
        for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
            for window in scene.windows {
                window.overrideUserInterfaceStyle = appearance.interfaceStyle
            }
        }
    }
}

/// Welcome, Sign in and Sign up.
private struct SignedOutRoot: View {
    @Environment(AppContainer.self) private var container
    @State private var path: [AuthRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            WelcomeScreen(
                onCreateAccount: { path.append(.signUp) },
                onSignIn: { path.append(.signIn) }
            )
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: AuthRoute.self) { route in
                Group {
                    switch route {
                    case .signIn:
                        SignInScreen(viewModel: AuthViewModel(mode: .signIn, container: container)) {
                            path = [.signUp]
                        }
                    case .signUp:
                        SignUpScreen(viewModel: AuthViewModel(mode: .signUp, container: container)) {
                            path = [.signIn]
                        }
                    }
                }
                .toolbar(.hidden, for: .navigationBar)
            }
        }
    }
}

/// The tabs, with every other signed-in screen pushed above them.
private struct SignedInRoot: View {
    @Environment(AppContainer.self) private var container
    let session: MemberSession

    var body: some View {
        @Bindable var router = session.router
        NavigationStack(path: $router.path) {
            TabsScreen()
                .toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: Route.self) { route in
                    destination(route)
                        .toolbar(.hidden, for: .navigationBar)
                }
        }
        .environment(session)
        .environment(session.router)
    }

    @ViewBuilder
    private func destination(_ route: Route) -> some View {
        switch route {
        case .restaurant(let id):
            RestaurantScreen(viewModel: RestaurantViewModel(session: session, restaurantId: id))
        case .reserve(let restaurantId, let reservationId, let rebookFromId):
            ReserveScreen(viewModel: ReserveViewModel(session: session, restaurantId: restaurantId, reservationId: reservationId, rebookFromId: rebookFromId))
        case .confirmation(let id):
            ConfirmationScreen(viewModel: ReservationDetailViewModel(session: session, reservationId: id))
        case .reservation(let id):
            ReservationDetailScreen(viewModel: ReservationDetailViewModel(session: session, reservationId: id))
        case .notifications:
            NotificationsScreen(viewModel: NotificationsViewModel(session: session))
        case .preferences:
            PreferencesScreen(viewModel: PreferencesViewModel(repository: session.preferencesRepository))
        case .help:
            HelpScreen()
        case .settings:
            SettingsScreen(viewModel: SettingsViewModel(repository: container.settingsRepository))
        }
    }
}

/// Keeps the interactive swipe-back gesture working while the system navigation bar is hidden.
extension UINavigationController: @retroactive UIGestureRecognizerDelegate {
    override open func viewDidLoad() {
        super.viewDidLoad()
        interactivePopGestureRecognizer?.delegate = self
    }

    public func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        viewControllers.count > 1
    }
}
