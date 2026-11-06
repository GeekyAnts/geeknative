import SwiftUI

/// The member's private collection of favourite restaurants.
struct SavedScreen: View {
    @State private var viewModel: SavedViewModel
    @Environment(AppRouter.self) private var router
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: SavedViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        let restaurants = viewModel.restaurants
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    ScreenHeader(overline: Strings.savedSubtitle, title: Strings.savedTitle)
                    if viewModel.state.value != nil {
                        Text(Strings.savedCount(count: restaurants.count))
                            .font(AppTypography.body)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                            .contentTransition(.numericText())
                            .accessibilityIdentifier("saved.count")
                    }
                }
                switch viewModel.state {
                case .loading:
                    ForEach(0..<2, id: \.self) { _ in
                        Skeleton(cornerRadius: AppRadius.lg).frame(height: AppSize.listImageHeight + AppSize.thumbnail)
                    }
                case .failed:
                    ErrorState { Task { await viewModel.retry() } }
                case .loaded:
                    if restaurants.isEmpty {
                        EmptyState(
                            icon: AppIcon.heart,
                            title: Strings.savedEmptyTitle,
                            message: Strings.savedEmptyBody,
                            actionTitle: Strings.savedEmptyCta,
                            action: { router.switchTab(.explore) }
                        )
                        .accessibilityIdentifier("saved.empty")
                        .transition(.opacity)
                    } else {
                        LazyVStack(spacing: AppSpacing.lg) {
                            ForEach(Array(restaurants.enumerated()), id: \.element.id) { index, restaurant in
                                RestaurantListItem(
                                    restaurant: restaurant,
                                    availability: viewModel.availability(restaurant),
                                    testID: "saved.item.\(restaurant.id)"
                                ) {
                                    router.push(.restaurant(restaurant.id))
                                }
                                .reveal(index)
                                .transition(.asymmetric(insertion: .opacity, removal: .opacity.combined(with: .scale(scale: 0.92, anchor: .top))))
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.top, AppSpacing.sm)
            .tabBarClearance()
        }
        .scrollIndicators(.hidden)
        .background(AppColors.background.ignoresSafeArea())
        .animation(AppMotion.reduced(AppMotion.gentle, reduceMotion), value: restaurants.map(\.id))
        .task { await viewModel.load() }
    }
}

#Preview {
    let session = MemberSession.preview()
    SavedScreen(viewModel: SavedViewModel(session: session))
        .environment(session)
        .environment(session.router)
}
