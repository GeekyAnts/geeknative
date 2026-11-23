import SwiftUI

/// The floating bar with the running total, on Home, Category and Search (spec/features/cart.md, Cart bar).
struct CartBar: View {
    let summary: CartSummary
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.md) {
                IconCircle(
                    icon: AppIcon.cart,
                    fill: AppColors.onPrimary.opacity(0.16),
                    foreground: AppColors.onPrimary,
                    diameter: 40,
                    iconSize: 20
                )
                VStack(alignment: .leading, spacing: 0) {
                    Text(Strings.commonItemCount(count: summary.itemCount))
                        .font(AppTypography.caption)
                        .opacity(0.85)
                        .contentTransition(.numericText(value: Double(summary.itemCount)))
                    Text(Strings.commonPrice(amount: summary.itemTotal))
                        .font(AppTypography.title)
                        .fontWeight(.bold)
                        .contentTransition(.numericText(value: Double(summary.itemTotal)))
                }
                Spacer(minLength: AppSpacing.sm)
                Text(Strings.cartBarViewCart)
                    .font(AppTypography.label)
                    .fontWeight(.bold)
                Image(AppIcon.chevronRight)
                    .resizable()
                    .scaledToFit()
                    .frame(width: AppIconSize.sm + 2, height: AppIconSize.sm + 2)
                    .accessibilityHidden(true)
            }
            .foregroundStyle(AppColors.onPrimary)
            .padding(.leading, AppSpacing.md)
            .padding(.trailing, AppSpacing.lg)
            .padding(.vertical, AppSpacing.md)
            .background(AppColors.primary, in: .rect(cornerRadius: AppRadius.lg))
            .shadow(color: AppColors.primary.opacity(0.35), radius: 16, y: 8)
            .contentShape(.rect(cornerRadius: AppRadius.lg))
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("cartBar")
    }
}

/// Floats the cart bar at the bottom while the cart has items, sliding it in when the first item is added.
private struct CartBarInset: ViewModifier {
    @Environment(AppContainer.self) private var container
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let onOpen: () -> Void

    func body(content: Content) -> some View {
        let summary = container.cartSummary
        content.safeAreaInset(edge: .bottom, spacing: 0) {
            ZStack {
                if summary.showsCartBar {
                    CartBar(summary: summary, action: onOpen)
                        .padding(.horizontal, AppSpacing.lg)
                        .padding(.top, AppSpacing.sm)
                        .padding(.bottom, AppSpacing.sm)
                        .transition(reduceMotion ? .opacity : .move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(Motion.spring(reduceMotion: reduceMotion), value: summary.showsCartBar)
            .animation(Motion.spring(reduceMotion: reduceMotion), value: summary.itemTotal)
        }
    }
}

extension View {
    /// Adds the floating cart bar (spec/features/cart.md). The content leaves room for it.
    func cartBar(onOpen: @escaping () -> Void) -> some View {
        modifier(CartBarInset(onOpen: onOpen))
    }
}

#Preview {
    let container = AppContainer.preview(cart: [CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)])
    ScrollView {
        Color.clear.frame(height: 400)
    }
    .background(AppColors.background)
    .cartBar {}
    .environment(container)
}
