import SwiftUI

struct HomeScreen: View {
    var body: some View {
        ScrollView {
            AppCard {
                Text(Strings.homeWelcomeTitle)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.onSurface)
                Text(Strings.homeWelcomeBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.background)
        .navigationTitle(AppIdentity.name)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                NavigationLink(value: Route.settings) {
                    Image(AppIcon.settings)
                }
                .accessibilityLabel(Strings.homeOpenSettings)
                .accessibilityIdentifier("home.openSettings")
            }
        }
    }
}

#Preview {
    NavigationStack {
        HomeScreen()
    }
    .environment(AppContainer.preview())
}
