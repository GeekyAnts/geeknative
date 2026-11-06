import SwiftUI

/// The primary action: `size.button` tall, full radius, `espresso` fill with `onEspresso` `label`
/// text, press scale 0.97, 40% opacity when disabled.
struct PrimaryButtonStyle: ButtonStyle {
    var fill = AppColors.espresso
    var foreground = AppColors.onEspresso
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.label)
            .foregroundStyle(foreground)
            .padding(.horizontal, AppSpacing.xl)
            .frame(maxWidth: .infinity, minHeight: AppSize.button)
            .background(fill, in: .capsule)
            .contentShape(.capsule)
            .scaleEffect(configuration.isPressed ? PressableButtonStyle.pressedScale : 1)
            .opacity(isEnabled ? 1 : 0.4)
            .animation(AppMotion.reduced(AppMotion.snappy, reduceMotion), value: configuration.isPressed)
    }
}

/// The secondary action: the same shape, transparent with a `primary` hairline and `primary` text.
struct SecondaryButtonStyle: ButtonStyle {
    var tint = AppColors.primary
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.label)
            .foregroundStyle(tint)
            .padding(.horizontal, AppSpacing.lg)
            .frame(maxWidth: .infinity, minHeight: AppSize.button)
            .overlay(Capsule().strokeBorder(tint, lineWidth: AppSize.hairline))
            .contentShape(.capsule)
            .scaleEffect(configuration.isPressed ? PressableButtonStyle.pressedScale : 1)
            .opacity(isEnabled ? 1 : 0.4)
            .animation(AppMotion.reduced(AppMotion.snappy, reduceMotion), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary: PrimaryButtonStyle { PrimaryButtonStyle() }
}

extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: SecondaryButtonStyle { SecondaryButtonStyle() }
}

/// A label with an optional leading icon, shared by the button components.
struct ButtonLabel: View {
    let title: String
    var icon: ImageResource?

    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            if let icon {
                Image(icon).renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.sm, height: AppIconSize.sm)
            }
            Text(title).lineLimit(1).minimumScaleFactor(0.8)
        }
    }
}

/// DESIGN.md `PrimaryButton`: a progress indicator replaces the label while busy.
struct PrimaryButton: View {
    let title: String
    var icon: ImageResource?
    var isBusy = false
    var fill = AppColors.espresso
    var foreground = AppColors.onEspresso
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                ButtonLabel(title: title, icon: icon).opacity(isBusy ? 0 : 1)
                if isBusy {
                    ProgressView().tint(foreground).accessibilityLabel(Strings.commonLoading)
                }
            }
        }
        .buttonStyle(PrimaryButtonStyle(fill: fill, foreground: foreground))
        .allowsHitTesting(!isBusy)
    }
}

/// DESIGN.md `SecondaryButton`.
struct SecondaryButton: View {
    let title: String
    var icon: ImageResource?
    var tint = AppColors.primary
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ButtonLabel(title: title, icon: icon)
        }
        .buttonStyle(SecondaryButtonStyle(tint: tint))
    }
}

#Preview {
    VStack(spacing: AppSpacing.lg) {
        PrimaryButton(title: Strings.restaurantReserve, icon: AppIcon.calendar) {}
        PrimaryButton(title: Strings.restaurantReserve, isBusy: true) {}
        PrimaryButton(title: Strings.restaurantReserve) {}.disabled(true)
        SecondaryButton(title: Strings.restaurantDirections, icon: AppIcon.directions) {}
    }
    .padding(AppSpacing.xl)
    .background(AppColors.background)
}
