import SwiftUI

/// A centered progress indicator labeled for VoiceOver (DESIGN.md: Loading).
struct LoadingView: View {
    var body: some View {
        ProgressView()
            .controlSize(.large)
            .tint(AppColors.onSurfaceVariant)
            .accessibilityLabel(Strings.commonLoading)
            .frame(maxWidth: .infinity, minHeight: AppSize.touchTarget * 4)
    }
}

/// An empty or error state: a centered icon, title, body and actions (DESIGN.md: Empty and error states).
/// Set its test ID with `.accessibilityIdentifier` on the view; the actions keep their own.
struct StateMessageView<Actions: View>: View {
    var icon: ImageResource?
    let title: String
    var message: String?
    @ViewBuilder var actions: Actions

    var body: some View {
        VStack(spacing: AppSpacing.md) {
            if let icon {
                Image(icon)
                    .resizable()
                    .scaledToFit()
                    .frame(width: AppIconSize.lg, height: AppIconSize.lg)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .accessibilityHidden(true)
            }
            Text(title)
                .font(AppTypography.title)
                .foregroundStyle(AppColors.onBackground)
            if let message {
                Text(message)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            actions
                .padding(.top, AppSpacing.sm)
        }
        .multilineTextAlignment(.center)
        .padding(AppSpacing.xl)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
    }
}

#Preview {
    VStack {
        LoadingView()
        StateMessageView(icon: AppIcon.emptyTasks, title: Strings.tasksEmptyTitle, message: Strings.tasksEmptyBody) {
            Button(Strings.tasksAdd) {}.buttonStyle(.primary)
        }
    }
    .background(AppColors.background)
}
