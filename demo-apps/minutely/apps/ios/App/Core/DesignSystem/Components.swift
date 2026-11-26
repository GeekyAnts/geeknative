import SwiftUI

/// Product or category artwork: the catalog's emoji, centered on its category tint (DESIGN.md, Artwork).
struct ArtworkTile: View {
    let emoji: String
    let categoryId: String
    /// The emoji's point size. Artwork, so it doesn't follow Dynamic Type.
    var emojiSize: CGFloat = 56
    var cornerRadius: CGFloat = AppRadius.lg

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(CategoryTint.color(for: categoryId))
            .overlay {
                Text(emoji)
                    .font(.system(size: emojiSize))
                    .minimumScaleFactor(0.5)
            }
            .accessibilityHidden(true)
    }
}

/// A price, followed by the MRP struck through when it's higher (DESIGN.md, Money).
struct PriceLabel: View {
    let price: Int
    let mrp: Int
    var priceFont: Font = AppTypography.label
    var axis: Axis = .vertical

    var body: some View {
        let layout = axis == .vertical
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: 0))
            : AnyLayout(HStackLayout(alignment: .firstTextBaseline, spacing: AppSpacing.xs))
        layout {
            Text(Strings.commonPrice(amount: price))
                .font(priceFont)
                .fontWeight(.bold)
                .foregroundStyle(AppColors.onSurface)
            if mrp > price {
                Text(Strings.commonPrice(amount: mrp))
                    .font(AppTypography.caption)
                    .strikethrough()
                    .foregroundStyle(AppColors.onSurfaceVariant)
                    .accessibilityLabel(Strings.commonMrp(amount: mrp))
            }
        }
        .lineLimit(1)
        .accessibilityElement(children: .combine)
    }
}

/// An icon centered in a filled circle: the delivery promise, the cart bar, empty states.
struct IconCircle: View {
    let icon: ImageResource
    let fill: Color
    let foreground: Color
    var diameter: CGFloat = 40
    var iconSize: CGFloat = AppIconSize.md

    var body: some View {
        Circle()
            .fill(fill)
            .frame(width: diameter, height: diameter)
            .overlay {
                Image(icon)
                    .resizable()
                    .scaledToFit()
                    .frame(width: iconSize, height: iconSize)
                    .foregroundStyle(foreground)
            }
            .accessibilityHidden(true)
    }
}

/// Centered icon in a `surfaceVariant` circle, title, body and an optional primary button (DESIGN.md, Empty state).
struct EmptyStateView: View {
    let icon: ImageResource
    let title: String
    let message: String
    var buttonTitle: String?
    var buttonIdentifier: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: AppSpacing.lg) {
            IconCircle(icon: icon, fill: AppColors.surfaceVariant, foreground: AppColors.onSurfaceVariant, diameter: 96, iconSize: 44)
                .padding(.bottom, AppSpacing.sm)
            VStack(spacing: AppSpacing.sm) {
                Text(title)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.onBackground)
                    .accessibilityAddTraits(.isHeader)
                Text(message)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .multilineTextAlignment(.center)
            if let buttonTitle, let action {
                PrimaryButton(title: buttonTitle, action: action)
                    .accessibilityIdentifier(buttonIdentifier ?? "")
                    .padding(.top, AppSpacing.sm)
            }
        }
        .padding(AppSpacing.xxl)
        .frame(maxWidth: .infinity)
    }
}

/// The primary action (DESIGN.md: `.borderedProminent`), with `onPrimary` text so it reads in dark mode too.
struct PrimaryButton: View {
    let title: String
    var isEnabled = true
    var fullWidth = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(AppTypography.body)
                .fontWeight(.bold)
                .foregroundStyle(AppColors.onPrimary)
                .padding(.horizontal, AppSpacing.sm)
                .frame(maxWidth: fullWidth ? .infinity : nil, minHeight: 36)
        }
        .buttonStyle(.borderedProminent)
        .buttonBorderShape(.roundedRectangle(radius: AppRadius.md))
        .controlSize(.large)
        .tint(AppColors.primary)
        .disabled(!isEnabled)
    }
}

/// The field shape shared by Home's search entry and Search's field (DESIGN.md, Field-shaped button).
struct FieldCapsule: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, AppSpacing.lg)
            .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
            .background(AppColors.surface, in: .capsule)
            .overlay(Capsule().strokeBorder(AppColors.outline, lineWidth: 1))
    }
}

extension View {
    func fieldCapsule() -> some View { modifier(FieldCapsule()) }
}

/// A section title in `AppTypography.title` (DESIGN.md, Section header).
struct SectionHeader: View {
    let title: String

    var body: some View {
        Text(title)
            .font(AppTypography.title)
            .foregroundStyle(AppColors.onBackground)
            .accessibilityAddTraits(.isHeader)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
