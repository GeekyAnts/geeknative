import SwiftUI

/// `GlassIconButton` with `heart` → `heartFilled` in `accent`; the icon pops 1 → 1.25 → 1 on toggle.
/// The saved state is shared through the member's `SavedRepository`, so every heart updates at once.
struct FavouriteButton: View {
    static let popScale: CGFloat = 1.25
    let restaurantId: String
    var onImage = true
    @Environment(MemberSession.self) private var session
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var scale: CGFloat = 1

    private var isSaved: Bool { session.savedRepository.isSaved(restaurantId) }

    var body: some View {
        Button(action: toggle) {
            Image(isSaved ? AppIcon.heartFilled : AppIcon.heart)
                .renderingMode(.template).resizable().scaledToFit()
                .frame(width: AppIconSize.md, height: AppIconSize.md)
                .foregroundStyle(isSaved ? AppColors.accent : (onImage ? AppColors.onGlassOnImage : AppColors.onSurface))
                .scaleEffect(scale)
                .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                .background {
                    if onImage {
                        Circle().fill(AppColors.glassOnImage).background(.ultraThinMaterial, in: .circle)
                    } else {
                        Circle().fill(AppColors.glass).background(.ultraThinMaterial, in: .circle)
                            .overlay(Circle().strokeBorder(AppColors.glassBorder, lineWidth: AppSize.hairline))
                    }
                }
                .contentShape(.circle)
        }
        .buttonStyle(.pressable)
        .sensoryFeedback(.impact(weight: .light), trigger: isSaved)
        .accessibilityLabel(isSaved ? Strings.restaurantUnsave : Strings.restaurantSave)
        .accessibilityAddTraits(isSaved ? .isSelected : [])
        .accessibilityIdentifier("favourite.\(restaurantId)")
    }

    private func toggle() {
        session.savedRepository.toggle(restaurantId)
        guard !reduceMotion else { return }
        withAnimation(AppMotion.snappy) {
            scale = Self.popScale
        } completion: {
            withAnimation(AppMotion.bouncy) { scale = 1 }
        }
    }
}

/// The tall featured card: full-bleed photo, scrim, heart, and the restaurant's essentials.
struct RestaurantCard: View {
    let restaurant: Restaurant
    let availability: TodayAvailability
    var testID: String?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack(alignment: .bottomLeading) {
                RemoteImage(url: restaurant.heroImage, label: restaurant.name)
                PhotoScrim()
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Overline(restaurant.cuisine.label)
                    Text(restaurant.name)
                        .font(AppSerif.title)
                        .foregroundStyle(AppColors.onSurface)
                        .lineLimit(2)
                    HStack(spacing: AppSpacing.sm) {
                        Text(restaurant.neighbourhood)
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                            .lineLimit(1)
                        Text(Formatters.separatorSymbol).foregroundStyle(AppColors.onSurfaceVariant)
                        RatingBadge(rating: restaurant.rating)
                        Text(Formatters.separatorSymbol).foregroundStyle(AppColors.onSurfaceVariant)
                        PriceLevel(level: restaurant.priceLevel)
                    }
                    .font(AppTypography.caption)
                    AvailabilityIndicator(availability: availability)
                }
                .padding(AppSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .multilineTextAlignment(.leading)
                .glassSurface(cornerRadius: AppRadius.lg, strong: true)
                .padding(AppSpacing.md)
            }
            .frame(width: AppSize.featuredCardWidth, height: AppSize.featuredCardHeight)
            .clipShape(.rect(cornerRadius: AppRadius.xl, style: .continuous))
            .contentShape(.rect(cornerRadius: AppRadius.xl))
        }
        .buttonStyle(.pressable)
        .accessibilityIdentifier(testID ?? "")
        .overlay(alignment: .topTrailing) {
            FavouriteButton(restaurantId: restaurant.id)
                .padding(AppSpacing.md)
        }
    }
}

/// A full-width solid card for lists: photo on top with the heart, then the details.
struct RestaurantListItem: View {
    let restaurant: Restaurant
    let availability: TodayAvailability
    let testID: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 0) {
                RemoteImage(url: restaurant.heroImage, label: restaurant.name)
                    .frame(height: AppSize.listImageHeight)
                    .frame(maxWidth: .infinity)
                VStack(alignment: .leading, spacing: AppSpacing.sm) {
                    GoldRule()
                    Text(restaurant.name)
                        .font(AppSerif.title)
                        .foregroundStyle(AppColors.onSurface)
                    HStack(spacing: AppSpacing.sm) {
                        RatingBadge(rating: restaurant.rating)
                        Text(Formatters.reviewCount(restaurant.reviewCount))
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                    }
                    HStack(spacing: AppSpacing.sm) {
                        Text(Strings.formatSeparator(first: restaurant.cuisine.label, second: restaurant.neighbourhood))
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.onSurfaceVariant)
                            .lineLimit(1)
                        Text(Formatters.separatorSymbol).font(AppTypography.caption).foregroundStyle(AppColors.onSurfaceVariant)
                        PriceLevel(level: restaurant.priceLevel)
                    }
                    Text(restaurant.tagline)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                    AvailabilityIndicator(availability: availability)
                }
                .padding(AppSpacing.lg)
                .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(AppColors.surface)
            .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
            .contentShape(.rect(cornerRadius: AppRadius.lg))
        }
        .buttonStyle(.pressable)
        .accessibilityIdentifier(testID)
        .overlay(alignment: .topTrailing) {
            FavouriteButton(restaurantId: restaurant.id)
                .padding(AppSpacing.md)
        }
    }
}

/// A grid cell: square photo, serif name (2 lines), rating and price.
struct RestaurantGridItem: View {
    let restaurant: Restaurant
    let testID: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                RemoteImage(url: restaurant.heroImage, label: restaurant.name)
                    .aspectRatio(1, contentMode: .fit)
                    .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
                Text(restaurant.name)
                    .font(AppSerif.title)
                    .foregroundStyle(AppColors.onBackground)
                    .lineLimit(2, reservesSpace: true)
                    .multilineTextAlignment(.leading)
                HStack(spacing: AppSpacing.sm) {
                    RatingBadge(rating: restaurant.rating)
                    PriceLevel(level: restaurant.priceLevel)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(.rect)
        }
        .buttonStyle(.pressable)
        .accessibilityIdentifier(testID)
    }
}

/// An editorial collection card: photo, scrim, serif title and caption subtitle.
struct CollectionCard: View {
    let collection: Collection
    let testID: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack(alignment: .bottomLeading) {
                RemoteImage(url: collection.image)
                PhotoScrim()
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    Text(collection.id.title)
                        .font(AppSerif.title)
                        .foregroundStyle(AppColors.onSurface)
                        .lineLimit(2)
                    Text(collection.id.subtitle)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .lineLimit(2)
                }
                .multilineTextAlignment(.leading)
                .padding(AppSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .glassSurface(cornerRadius: AppRadius.md, strong: true)
                .padding(AppSpacing.md)
            }
            .frame(width: AppSize.collectionCardWidth, height: AppSize.collectionCardHeight)
            .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
            .contentShape(.rect(cornerRadius: AppRadius.lg))
        }
        .buttonStyle(.pressable)
        .accessibilityIdentifier(testID)
    }
}
