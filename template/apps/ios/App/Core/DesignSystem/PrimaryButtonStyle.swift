import SwiftUI

/// The primary action (DESIGN.md: Primary action): `onPrimary` text on a `primary` fill, in light
/// and dark mode alike, at least `AppSize.touchTarget` tall. `.borderedProminent` on its own draws
/// white text, which is unreadable on a light dark-mode `primary`; Android and the web use
/// `onPrimary`, so this keeps iOS the same.
struct PrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.label)
            .foregroundStyle(AppColors.onPrimary)
            .padding(.horizontal, AppSpacing.lg)
            .frame(minHeight: AppSize.touchTarget)
            .background(AppColors.primary, in: .capsule)
            .opacity(isEnabled ? (configuration.isPressed ? 0.8 : 1) : 0.4)
            .contentShape(.capsule)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    /// `Button(...) { }.buttonStyle(.primary)`
    static var primary: PrimaryButtonStyle { PrimaryButtonStyle() }
}

#Preview {
    VStack(spacing: AppSpacing.lg) {
        Button(Strings.settingsTitle) {}.buttonStyle(.primary)
        Button(Strings.settingsTitle) {}.buttonStyle(.primary).disabled(true)
    }
    .padding(AppSpacing.xl)
    .background(AppColors.background)
}
