import SwiftUI

/// The five tab roots and the floating `TabBar`. Every root stays alive, so each keeps its scroll
/// position while the member switches tabs.
struct TabsScreen: View {
    @Environment(MemberSession.self) private var session
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        @Bindable var router = router
        ZStack(alignment: .bottom) {
            ForEach(AppTab.allCases) { tab in
                let isSelected = tab == router.selectedTab
                root(tab)
                    .opacity(isSelected ? 1 : 0)
                    .allowsHitTesting(isSelected)
                    .accessibilityHidden(!isSelected)
                    .zIndex(isSelected ? 1 : 0)
            }
            TabBar(selection: $router.selectedTab)
                .zIndex(2)
        }
        .animation(AppMotion.reduced(AppMotion.standard(AppMotion.fast), reduceMotion), value: router.selectedTab)
        .clubBackground()
    }

    @ViewBuilder
    private func root(_ tab: AppTab) -> some View {
        switch tab {
        case .discover: DiscoverScreen(viewModel: DiscoverViewModel(session: session))
        case .explore: ExploreScreen(viewModel: ExploreViewModel(session: session))
        case .reservations: ReservationsScreen(viewModel: ReservationsViewModel(session: session))
        case .saved: SavedScreen(viewModel: SavedViewModel(session: session))
        case .profile: ProfileScreen(viewModel: ProfileViewModel(session: session))
        }
    }
}

/// Bottom padding for scrollable tab screens, so content clears the tab bar.
extension View {
    func tabBarClearance() -> some View {
        padding(.bottom, AppSize.tabBar + AppSpacing.xl)
    }
}

#Preview {
    let session = MemberSession.preview()
    TabsScreen()
        .environment(session)
        .environment(session.router)
}
