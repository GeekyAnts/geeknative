import SwiftUI

/// The cart, the bill and Place order (spec/features/cart.md).
struct CartScreen: View {
    @State private var viewModel: CartViewModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: CartViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        Group {
            if viewModel.isEmpty && !viewModel.isPlacingOrder {
                empty
            } else {
                filled
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.background)
        .navigationTitle(Strings.cartTitle)
        .navigationBarTitleDisplayMode(.inline)
        .animation(Motion.spring(reduceMotion: reduceMotion), value: viewModel.isEmpty)
    }

    private var empty: some View {
        EmptyStateView(
            icon: AppIcon.cart,
            title: Strings.cartEmptyTitle,
            message: Strings.cartEmptyBody,
            buttonTitle: Strings.cartStartShopping,
            buttonIdentifier: "cart.startShopping",
            action: viewModel.startShopping
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("cart.empty")
    }

    private var filled: some View {
        let summary = viewModel.summary
        return ScrollView {
            VStack(spacing: AppSpacing.md) {
                deliveryCard(summary)
                linesCard
                freeDeliveryCard(summary)
                billCard(summary)
                addressCard
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.vertical, AppSpacing.sm)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) { checkoutBar(summary) }
    }

    // MARK: - Cards

    private func deliveryCard(_ summary: CartSummary) -> some View {
        AppCard {
            HStack(spacing: AppSpacing.md) {
                IconCircle(icon: AppIcon.delivery, fill: AppColors.accent, foreground: AppColors.onAccent, diameter: 44)
                VStack(alignment: .leading, spacing: 2) {
                    Text(Strings.commonDeliveryIn(minutes: AppConfig.deliveryMinutes))
                        .font(AppTypography.title)
                        .foregroundStyle(AppColors.onSurface)
                    Text(Strings.cartShipment(count: summary.itemCount))
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .contentTransition(.numericText(value: Double(summary.itemCount)))
                }
            }
            .accessibilityElement(children: .combine)
        }
    }

    private var linesCard: some View {
        let rows = viewModel.rows
        return AppCard {
            ForEach(Array(rows.enumerated()), id: \.element.id) { index, row in
                if index > 0 {
                    Divider().overlay(AppColors.outline).padding(.vertical, AppSpacing.xs)
                }
                lineRow(row)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .animation(Motion.spring(reduceMotion: reduceMotion), value: rows.map(\.id))
    }

    private func lineRow(_ row: CartRow) -> some View {
        HStack(alignment: .center, spacing: AppSpacing.md) {
            ArtworkTile(emoji: row.product.emoji, categoryId: row.product.categoryId, emojiSize: 28, cornerRadius: AppRadius.md)
                .frame(width: 52, height: 52)
            VStack(alignment: .leading, spacing: 2) {
                Text(row.product.name)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onSurface)
                    .lineLimit(2)
                Text(row.product.unit)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            QuantityStepper(
                productId: row.product.id,
                productName: row.product.name,
                quantity: row.quantity,
                onIncrease: { viewModel.increase(row.product.id) },
                onDecrease: { viewModel.decrease(row.product.id) }
            )
            PriceLabel(price: row.lineTotal, mrp: row.lineMrp)
                .frame(minWidth: 48, alignment: .trailing)
                .contentTransition(.numericText(value: Double(row.lineTotal)))
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("cart.line.\(row.product.id)")
    }

    private func freeDeliveryCard(_ summary: CartSummary) -> some View {
        AppCard {
            Text(summary.hasFreeDelivery
                 ? Strings.cartFreeDeliveryUnlocked
                 : Strings.cartFreeDeliveryNudge(amount: summary.amountToFreeDelivery))
                .font(AppTypography.label)
                .fontWeight(summary.hasFreeDelivery ? .bold : .medium)
                .foregroundStyle(summary.hasFreeDelivery ? AppColors.primary : AppColors.onSurface)
                .contentTransition(.numericText(value: Double(summary.amountToFreeDelivery)))
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(AppColors.surfaceVariant)
                    Capsule()
                        .fill(AppColors.primary)
                        .frame(width: max(8, proxy.size.width * summary.freeDeliveryProgress))
                }
            }
            .frame(height: 8)
            .animation(Motion.ease(reduceMotion: reduceMotion), value: summary.freeDeliveryProgress)
            .accessibilityHidden(true)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("cart.freeDelivery")
    }

    private func billCard(_ summary: CartSummary) -> some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                Text(Strings.cartBillTitle)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.onSurface)
                    .accessibilityAddTraits(.isHeader)

                billRow(Strings.cartItemTotal) {
                    HStack(alignment: .firstTextBaseline, spacing: AppSpacing.xs) {
                        Text(Strings.commonPrice(amount: summary.itemTotal))
                            .font(AppTypography.label)
                            .foregroundStyle(AppColors.onSurface)
                            .accessibilityIdentifier("cart.itemTotal")
                        if summary.savings > 0 {
                            Text(Strings.commonPrice(amount: summary.mrpTotal))
                                .font(AppTypography.caption)
                                .strikethrough()
                                .foregroundStyle(AppColors.onSurfaceVariant)
                                .accessibilityLabel(Strings.commonMrp(amount: summary.mrpTotal))
                        }
                    }
                }

                billRow(Strings.cartDeliveryFee) {
                    Group {
                        if summary.deliveryFee == 0 {
                            Text(Strings.cartFree)
                                .fontWeight(.bold)
                                .foregroundStyle(AppColors.primary)
                        } else {
                            Text(Strings.commonPrice(amount: summary.deliveryFee))
                                .foregroundStyle(AppColors.onSurface)
                        }
                    }
                    .font(AppTypography.label)
                    .accessibilityIdentifier("cart.deliveryFee")
                }

                Divider().overlay(AppColors.outline)

                HStack {
                    Text(Strings.cartToPay)
                    Spacer()
                    Text(Strings.commonPrice(amount: summary.toPay))
                        .contentTransition(.numericText(value: Double(summary.toPay)))
                        .accessibilityIdentifier("cart.toPay")
                }
                .font(AppTypography.body)
                .fontWeight(.bold)
                .foregroundStyle(AppColors.onSurface)
                .accessibilityElement(children: .combine)
            }
            .padding(AppSpacing.lg)

            if summary.savings > 0 {
                HStack(spacing: AppSpacing.sm) {
                    Image(AppIcon.savings)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 18, height: 18)
                        .accessibilityHidden(true)
                    Text(Strings.cartSavings(amount: summary.savings))
                        .font(AppTypography.label)
                        .fontWeight(.bold)
                }
                .foregroundStyle(AppColors.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, AppSpacing.lg)
                .padding(.vertical, AppSpacing.md)
                .background(AppColors.surfaceVariant)
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("cart.savings")
            }
        }
        .background(AppColors.surface)
        .clipShape(.rect(cornerRadius: AppRadius.lg))
    }

    private func billRow<Value: View>(_ title: String, @ViewBuilder value: () -> Value) -> some View {
        HStack {
            Text(title)
                .font(AppTypography.label)
                .foregroundStyle(AppColors.onSurfaceVariant)
            Spacer()
            value()
        }
        .accessibilityElement(children: .combine)
    }

    private var addressCard: some View {
        AppCard {
            HStack(alignment: .center, spacing: AppSpacing.md) {
                IconCircle(icon: AppIcon.location, fill: AppColors.surfaceVariant, foreground: AppColors.onSurface, diameter: 40, iconSize: 20)
                VStack(alignment: .leading, spacing: 2) {
                    Text(Strings.cartDeliverTo)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                    Text(Strings.commonDeliveryAddress)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurface)
                }
            }
            .accessibilityElement(children: .combine)
        }
    }

    // MARK: - Checkout bar

    private func checkoutBar(_ summary: CartSummary) -> some View {
        HStack(spacing: AppSpacing.lg) {
            VStack(alignment: .leading, spacing: 2) {
                Text(Strings.commonPrice(amount: summary.toPay))
                    .font(AppTypography.title)
                    .fontWeight(.bold)
                    .foregroundStyle(AppColors.onSurface)
                    .contentTransition(.numericText(value: Double(summary.toPay)))
                Text(Strings.cartPaymentNote)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .accessibilityElement(children: .combine)
            Spacer(minLength: 0)
            // The success haptic plays as Order placed appears (spec/features/order.md, Platform notes).
            PrimaryButton(title: Strings.cartPlaceOrder, isEnabled: viewModel.canPlaceOrder) {
                viewModel.placeOrder()
            }
            .accessibilityIdentifier("cart.placeOrder")
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, AppSpacing.md)
        .background {
            AppColors.surface
                .ignoresSafeArea(edges: .bottom)
                .overlay(alignment: .top) {
                    Rectangle().fill(AppColors.outline).frame(height: 1)
                }
        }
    }
}

#Preview("With items") {
    let container = AppContainer.preview(cart: [
        CartLine(productId: "banana", quantity: 2),
        CartLine(productId: "milk", quantity: 1),
        CartLine(productId: "cookies", quantity: 1),
    ])
    NavigationStack {
        CartScreen(viewModel: CartViewModel(container: container))
    }
    .environment(container)
}

#Preview("Empty") {
    let container = AppContainer.preview()
    NavigationStack {
        CartScreen(viewModel: CartViewModel(container: container))
    }
    .environment(container)
}
