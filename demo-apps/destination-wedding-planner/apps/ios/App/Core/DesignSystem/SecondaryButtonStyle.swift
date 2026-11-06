import SwiftUI

/// Capsule stroke in `primary` (DESIGN.md: Secondary action).
struct SecondaryButtonStyle: ButtonStyle {
    var foreground: Color = AppColors.primary
    var stroke: Color = AppColors.primary

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.label)
            .foregroundStyle(foreground)
            .padding(.horizontal, AppSpacing.lg)
            .frame(minHeight: AppSize.touchTarget)
            .overlay {
                Capsule().stroke(stroke)
            }
            .opacity(configuration.isPressed ? 0.8 : 1)
            .contentShape(.capsule)
    }
}

extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: SecondaryButtonStyle { SecondaryButtonStyle() }

    static var secondaryOnImage: SecondaryButtonStyle {
        SecondaryButtonStyle(foreground: AppColors.inverse, stroke: AppColors.inverse)
    }
}
