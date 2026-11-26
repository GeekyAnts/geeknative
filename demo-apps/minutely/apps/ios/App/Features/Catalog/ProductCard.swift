import SwiftUI

/// A product as shown on Home, Category and Search (spec/features/catalog.md, Product card).
/// Its quantity is the product's cart quantity, so it matches everywhere.
struct ProductCard: View {
    let product: Product
    let cart: any CartRepository

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            ArtworkTile(emoji: product.emoji, categoryId: product.categoryId, emojiSize: 60, cornerRadius: AppRadius.md)
                .aspectRatio(1.1, contentMode: .fit)
                .overlay(alignment: .topLeading) { discountBadge }

            VStack(alignment: .leading, spacing: 2) {
                Text(product.unit)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .lineLimit(1)
                Text(product.name)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onSurface)
                    .lineLimit(2, reservesSpace: true)
                    .multilineTextAlignment(.leading)
            }
            .padding(.horizontal, AppSpacing.xs)

            ViewThatFits(in: .horizontal) {
                HStack(alignment: .center, spacing: AppSpacing.xs) {
                    PriceLabel(price: product.price, mrp: product.mrp)
                    Spacer(minLength: 0)
                    stepper
                }
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    PriceLabel(price: product.price, mrp: product.mrp, axis: .horizontal)
                    stepper
                }
            }
            .padding(.horizontal, AppSpacing.xs)
            .padding(.bottom, AppSpacing.xs)
        }
        .padding(AppSpacing.sm)
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("product.\(product.id)")
    }

    private var stepper: some View {
        QuantityStepper(
            productId: product.id,
            productName: product.name,
            quantity: cart.quantity(of: product.id),
            onIncrease: { cart.add(product.id) },
            onDecrease: { cart.remove(product.id) }
        )
    }

    @ViewBuilder
    private var discountBadge: some View {
        if product.hasDiscount {
            Text(Strings.commonPercentOff(percent: product.discountPercent))
                .font(AppTypography.caption)
                .fontWeight(.bold)
                .foregroundStyle(AppColors.onDeal)
                .padding(.horizontal, AppSpacing.sm)
                .padding(.vertical, 3)
                .background(
                    AppColors.deal,
                    in: UnevenRoundedRectangle(topLeadingRadius: AppRadius.md, bottomTrailingRadius: AppRadius.md)
                )
        }
    }
}

#Preview {
    let container = AppContainer.preview(cart: [CartLine(productId: "apple", quantity: 2)])
    let catalog = container.catalogRepository
    LazyVGrid(columns: [GridItem(.flexible(), spacing: AppSpacing.md), GridItem(.flexible())], spacing: AppSpacing.md) {
        ForEach(["banana", "apple", "milk", "chocolate"], id: \.self) { id in
            ProductCard(product: catalog.product(id: id)!, cart: container.cartRepository)
        }
    }
    .padding(AppSpacing.lg)
    .background(AppColors.background)
}
