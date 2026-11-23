import SwiftUI

/// The add control on product cards and cart lines (DESIGN.md, Quantity stepper):
/// an outlined Add button at 0 that springs into a filled `primary` capsule with − count +.
struct QuantityStepper: View {
    let productId: String
    let productName: String
    let quantity: Int
    let onIncrease: () -> Void
    let onDecrease: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .subheadline) private var height: CGFloat = 36
    @ScaledMetric(relativeTo: .subheadline) private var width: CGFloat = 92

    /// Whether the control shows the count (− n +) rather than Add.
    static func showsCount(quantity: Int) -> Bool { quantity > 0 }

    var body: some View {
        ZStack {
            if Self.showsCount(quantity: quantity) {
                stepper
                    .transition(reduceMotion ? .opacity : .scale(scale: 0.7).combined(with: .opacity))
            } else {
                addButton
                    .transition(reduceMotion ? .opacity : .scale(scale: 0.85).combined(with: .opacity))
            }
        }
        .frame(width: width, height: height)
        .animation(Motion.spring(reduceMotion: reduceMotion), value: Self.showsCount(quantity: quantity))
        .sensoryFeedback(trigger: quantity) { old, new in
            new > old ? .increase : .decrease
        }
    }

    private var addButton: some View {
        Button(action: onIncrease) {
            Text(Strings.commonAdd)
                .font(AppTypography.label)
                .fontWeight(.bold)
                .foregroundStyle(AppColors.primary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(AppColors.primary.opacity(0.08), in: .rect(cornerRadius: AppRadius.sm))
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.sm)
                        .strokeBorder(AppColors.primary, lineWidth: 1.5)
                )
                .contentShape(.rect.inset(by: -4))
        }
        .buttonStyle(.pressable)
        .accessibilityLabel(Strings.commonAddItem(name: productName))
        .accessibilityIdentifier("product.\(productId).add")
    }

    private var stepper: some View {
        HStack(spacing: 0) {
            stepButton(icon: AppIcon.remove, label: Strings.commonDecrease(name: productName), id: "decrease", action: onDecrease)
            Text(quantity, format: .number)
                .font(AppTypography.label)
                .fontWeight(.bold)
                .monospacedDigit()
                .foregroundStyle(AppColors.onPrimary)
                .contentTransition(.numericText(value: Double(quantity)))
                .animation(Motion.spring(reduceMotion: reduceMotion), value: quantity)
                .frame(minWidth: AppSpacing.lg)
                .accessibilityLabel(productName)
                .accessibilityValue(Strings.commonInCart(count: quantity))
                .accessibilityIdentifier("product.\(productId).quantity")
            stepButton(icon: AppIcon.add, label: Strings.commonIncrease(name: productName), id: "increase", action: onIncrease)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.primary, in: .rect(cornerRadius: AppRadius.sm))
    }

    private func stepButton(icon: ImageResource, label: String, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(icon)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                .foregroundStyle(AppColors.onPrimary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .contentShape(.rect.inset(by: -4))
        }
        .buttonStyle(.pressable)
        .accessibilityLabel(label)
        .accessibilityIdentifier("product.\(productId).\(id)")
    }
}

#Preview {
    @Previewable @State var quantity = 0
    VStack(spacing: AppSpacing.lg) {
        QuantityStepper(productId: "banana", productName: "Robusta Banana", quantity: quantity,
                        onIncrease: { quantity += 1 }, onDecrease: { quantity -= 1 })
        QuantityStepper(productId: "milk", productName: "Toned Milk", quantity: 3, onIncrease: {}, onDecrease: {})
    }
    .padding()
    .background(AppColors.background)
}
