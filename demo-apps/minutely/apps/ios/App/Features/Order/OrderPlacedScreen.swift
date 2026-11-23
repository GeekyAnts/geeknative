import SwiftUI

/// Confirms a placed order (spec/features/order.md).
struct OrderPlacedScreen: View {
    @State private var viewModel: OrderPlacedViewModel
    @State private var heroShown = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: OrderPlacedViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        Group {
            if let order = viewModel.order {
                found(order)
            } else {
                notFound
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.background)
        .navigationTitle(Strings.orderTitle)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Found

    private func found(_ order: Order) -> some View {
        ScrollView {
            VStack(spacing: AppSpacing.lg) {
                hero
                statusCard
                summaryCard(order)
                PrimaryButton(title: Strings.orderContinueShopping, fullWidth: true, action: viewModel.continueShopping)
                    .accessibilityIdentifier("order.continueShopping")
                    .padding(.top, AppSpacing.sm)
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.bottom, AppSpacing.xl)
        }
        .onAppear { heroShown = true }
        .sensoryFeedback(.success, trigger: heroShown) { _, shown in shown }
    }

    private var hero: some View {
        VStack(spacing: AppSpacing.md) {
            ZStack {
                Circle()
                    .fill(AppColors.primary.opacity(0.15))
                    .frame(width: 120, height: 120)
                    .scaleEffect(heroShown || reduceMotion ? 1 : 0.6)
                IconCircle(icon: AppIcon.orderPlaced, fill: AppColors.primary, foreground: AppColors.onPrimary, diameter: 88, iconSize: 48)
                    .scaleEffect(heroShown || reduceMotion ? 1 : 0.3)
            }
            .opacity(heroShown ? 1 : 0)
            .animation(reduceMotion ? .easeOut(duration: 0.2) : .spring(duration: 0.3, bounce: 0.5), value: heroShown)
            .padding(.top, AppSpacing.lg)

            Text(Strings.orderPlacedTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
                .accessibilityAddTraits(.isHeader)
            Text(viewModel.deliveryText)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .multilineTextAlignment(.center)
            Text(viewModel.numberText)
                .font(AppTypography.label)
                .fontWeight(.bold)
                .foregroundStyle(AppColors.onSurface)
                .padding(.horizontal, AppSpacing.md)
                .padding(.vertical, AppSpacing.xs + 2)
                .background(AppColors.surfaceVariant, in: .capsule)
                .accessibilityIdentifier("order.number")
        }
        .frame(maxWidth: .infinity)
    }

    private var statusCard: some View {
        AppCard {
            Text(Strings.orderTrackingTitle)
                .font(AppTypography.title)
                .foregroundStyle(AppColors.onSurface)
                .accessibilityAddTraits(.isHeader)
                .padding(.bottom, AppSpacing.xs)
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(viewModel.steps.enumerated()), id: \.element.id) { index, step in
                    timelineRow(step, isLast: index == viewModel.steps.count - 1)
                }
            }
        }
    }

    private func timelineRow(_ step: OrderPlacedViewModel.Step, isLast: Bool) -> some View {
        HStack(alignment: .top, spacing: AppSpacing.md) {
            VStack(spacing: 0) {
                indicator(step.state)
                if !isLast {
                    Rectangle()
                        .fill(step.state == .done ? AppColors.primary : AppColors.outline)
                        .frame(width: 2)
                        .frame(minHeight: AppSpacing.lg)
                }
            }
            .frame(width: 24)
            Text(step.title)
                .font(AppTypography.label)
                .fontWeight(step.state == .current ? .bold : .medium)
                .foregroundStyle(step.state == .pending ? AppColors.onSurfaceVariant : AppColors.onSurface)
                .padding(.top, 2)
                .padding(.bottom, isLast ? 0 : AppSpacing.lg)
        }
        .fixedSize(horizontal: false, vertical: true)
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder
    private func indicator(_ state: OrderPlacedViewModel.StepState) -> some View {
        switch state {
        case .done:
            IconCircle(icon: AppIcon.check, fill: AppColors.primary, foreground: AppColors.onPrimary, diameter: 24, iconSize: AppIconSize.sm)
        case .current:
            Circle()
                .strokeBorder(AppColors.primary, lineWidth: 3)
                .background(Circle().fill(AppColors.primary.opacity(0.15)))
                .frame(width: 24, height: 24)
        case .pending:
            Circle()
                .strokeBorder(AppColors.outline, lineWidth: 2)
                .frame(width: 24, height: 24)
        }
    }

    private func summaryCard(_ order: Order) -> some View {
        AppCard {
            HStack(alignment: .firstTextBaseline) {
                Text(Strings.orderSummaryTitle)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.onSurface)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                Text(viewModel.itemCountText)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .padding(.bottom, AppSpacing.xs)

            ForEach(order.lines, id: \.productId) { line in
                HStack(spacing: AppSpacing.md) {
                    ArtworkTile(emoji: line.emoji, categoryId: line.categoryId, emojiSize: 22, cornerRadius: AppRadius.sm)
                        .frame(width: 40, height: 40)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(viewModel.lineText(line))
                            .font(AppTypography.label)
                            .foregroundStyle(AppColors.onSurface)
                        Text(line.unit)
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Text(Strings.commonPrice(amount: line.lineTotal))
                        .font(AppTypography.label)
                        .fontWeight(.semibold)
                        .foregroundStyle(AppColors.onSurface)
                }
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("order.line.\(line.productId)")
            }

            Divider().overlay(AppColors.outline).padding(.vertical, AppSpacing.xs)

            HStack {
                Text(Strings.orderTotal)
                Spacer()
                Text(viewModel.totalText)
                    .accessibilityIdentifier("order.total")
            }
            .font(AppTypography.body)
            .fontWeight(.bold)
            .foregroundStyle(AppColors.onSurface)
            .accessibilityElement(children: .combine)
        }
    }

    // MARK: - Not found

    private var notFound: some View {
        EmptyStateView(
            icon: AppIcon.receipt,
            title: Strings.orderNotFoundTitle,
            message: Strings.orderNotFoundBody,
            buttonTitle: Strings.orderContinueShopping,
            buttonIdentifier: "order.continueShopping",
            action: viewModel.continueShopping
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("order.notFound")
    }
}

#Preview("Placed") {
    let catalog = LocalCatalogRepository()
    let order = Order.make(
        lines: [CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)],
        catalog: catalog,
        placedAt: 1_761_800_123_456
    )
    let container = AppContainer.preview(orders: [order])
    NavigationStack {
        OrderPlacedScreen(viewModel: OrderPlacedViewModel(orderId: order.id, container: container))
    }
    .environment(container)
}

#Preview("Not found") {
    let container = AppContainer.preview()
    NavigationStack {
        OrderPlacedScreen(viewModel: OrderPlacedViewModel(orderId: "MN000000", container: container))
    }
    .environment(container)
}
