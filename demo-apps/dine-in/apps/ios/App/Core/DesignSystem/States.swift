import SwiftUI

/// `surfaceVariant` blocks with a slow shimmer (static with reduce motion).
struct Skeleton: View {
    var cornerRadius: CGFloat = AppRadius.md
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var phase: CGFloat = -1

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(AppColors.surfaceVariant)
            .overlay {
                if !reduceMotion {
                    GeometryReader { proxy in
                        LinearGradient(
                            colors: [AppColors.surface.opacity(0), AppColors.surface.opacity(0.55), AppColors.surface.opacity(0)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                        .frame(width: proxy.size.width * 0.6)
                        .offset(x: phase * proxy.size.width * 1.6)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
                }
            }
            .onAppear {
                guard !reduceMotion else { return }
                // DESIGN.md: a 1.2 s loop, twice the page duration.
                withAnimation(.linear(duration: AppMotion.page * 2).repeatForever(autoreverses: false)) {
                    phase = 1
                }
            }
            .accessibilityLabel(Strings.commonLoading)
    }
}

/// Centered: `accent` icon in a `surfaceVariant` circle, serif title, body and an optional button.
struct EmptyState: View {
    let icon: ImageResource
    let title: String
    let message: String
    var actionTitle: String?
    var actionTestID: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: AppSpacing.lg) {
            Image(icon)
                .renderingMode(.template).resizable().scaledToFit()
                .frame(width: AppIconSize.xl, height: AppIconSize.xl)
                .foregroundStyle(AppColors.accent)
                .frame(width: AppIconSize.xl * 2, height: AppIconSize.xl * 2)
                .background(AppColors.surfaceVariant, in: .circle)
            VStack(spacing: AppSpacing.sm) {
                Text(title)
                    .font(AppSerif.title)
                    .foregroundStyle(AppColors.onBackground)
                    .multilineTextAlignment(.center)
                Text(message)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .multilineTextAlignment(.center)
            }
            if let actionTitle, let action {
                PrimaryButton(title: actionTitle, action: action)
                    .accessibilityIdentifier(actionTestID ?? "")
                    .frame(maxWidth: AppSize.featuredCardWidth)
            }
        }
        .padding(.horizontal, AppSpacing.xl)
        .padding(.vertical, AppSpacing.xxxl)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
    }
}

/// `EmptyState` for failures, with a retry button.
struct ErrorState: View {
    let retry: () -> Void

    var body: some View {
        EmptyState(icon: AppIcon.alert, title: Strings.commonErrorTitle, message: Strings.commonErrorBody, actionTitle: Strings.commonRetry, action: retry)
    }
}

/// A photo from a URL, filling its frame, with a shimmering skeleton while loading and a
/// `utensils` placeholder on failure. Uses the shared URLCache configured at launch.
struct RemoteImage: View {
    let url: String
    var label: String?

    var body: some View {
        Color.clear
            .overlay {
                AsyncImage(url: URL(string: url), transaction: Transaction(animation: AppMotion.standard(AppMotion.normal))) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill().transition(.opacity)
                    case .failure:
                        ZStack {
                            AppColors.surfaceVariant
                            Image(AppIcon.utensils)
                                .renderingMode(.template).resizable().scaledToFit()
                                .frame(width: AppIconSize.xl, height: AppIconSize.xl)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                        }
                    default:
                        Skeleton(cornerRadius: 0)
                    }
                }
            }
            .clipped()
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(label ?? "")
            .accessibilityHidden(label == nil)
    }
}

extension URLCache {
    /// A larger shared cache for restaurant photography. AppMain installs it at launch.
    static func configureForPhotography() {
        URLCache.shared = URLCache(memoryCapacity: 64 * 1024 * 1024, diskCapacity: 512 * 1024 * 1024)
    }
}
