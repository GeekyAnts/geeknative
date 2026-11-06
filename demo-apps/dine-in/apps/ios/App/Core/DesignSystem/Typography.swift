import SwiftUI

/// Uppercase `overline` text with generous tracking, in `accent` (or `onGlassOnImage` on photos).
struct Overline: View {
    let text: String
    var color = AppColors.accent

    init(_ text: String, color: Color = AppColors.accent) {
        self.text = text
        self.color = color
    }

    var body: some View {
        Text(text.uppercased())
            .font(AppTypography.overline)
            .tracking(AppSize.tracking)
            .foregroundStyle(color)
    }
}

/// A short gold bar under editorial overlines (DESIGN.md: GoldRule).
struct GoldRule: View {
    var body: some View {
        Capsule()
            .fill(AppColors.accent)
            .frame(width: AppSpacing.xxl, height: AppSpacing.xxs)
            .accessibilityHidden(true)
    }
}

/// An `Overline`, gold rule and serif `title`, with an optional trailing "See all" link.
struct SectionHeader: View {
    var overline: String?
    let title: String
    var onSeeAll: (() -> Void)?

    var body: some View {
        HStack(alignment: .lastTextBaseline, spacing: AppSpacing.md) {
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                if let overline { Overline(overline) }
                GoldRule()
                Text(title)
                    .font(AppSerif.title)
                    .foregroundStyle(AppColors.onBackground)
                    .accessibilityAddTraits(.isHeader)
            }
            Spacer(minLength: 0)
            if let onSeeAll {
                Button(action: onSeeAll) {
                    Text(Strings.commonSeeAll)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.primary)
                        .frame(minHeight: AppSize.touchTarget)
                }
            }
        }
    }
}

/// The in-content, leading-aligned screen title: optional overline, serif `display` title and an
/// optional `body` subtitle.
struct ScreenHeader: View {
    var overline: String?
    let title: String
    var subtitle: String?

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            if let overline { Overline(overline) }
            GoldRule()
            Text(title)
                .font(AppSerif.display)
                .foregroundStyle(AppColors.onBackground)
                .accessibilityAddTraits(.isHeader)
            if let subtitle {
                Text(subtitle)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The demonstration-data note.
struct DemoNote: View {
    var text = Strings.commonDemoAvailabilityNote

    var body: some View {
        HStack(alignment: .top, spacing: AppSpacing.sm) {
            Image(AppIcon.info)
                .renderingMode(.template).resizable().scaledToFit()
                .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                .foregroundStyle(AppColors.onSurfaceVariant)
            Text(text)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
            Text(Strings.commonDemoBadge.uppercased())
                .font(AppTypography.overline)
                .tracking(AppSize.tracking / 2)
                .foregroundStyle(AppColors.onAccent)
                .padding(.horizontal, AppSpacing.sm)
                .padding(.vertical, AppSpacing.xxs)
                .background(AppColors.accent, in: .capsule)
        }
        .padding(AppSpacing.md)
        .background(AppColors.surfaceVariant, in: .rect(cornerRadius: AppRadius.md))
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("demoNote")
    }
}

/// `starFilled` in `accent` with the rating to one decimal.
struct RatingBadge: View {
    let rating: Double
    var color = AppColors.onSurface

    var body: some View {
        HStack(spacing: AppSpacing.xs) {
            Image(AppIcon.starFilled)
                .renderingMode(.template).resizable().scaledToFit()
                .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                .foregroundStyle(AppColors.accent)
            Text(Formatters.rating(rating))
                .font(AppTypography.label)
                .foregroundStyle(color)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Strings.restaurantRatingLabel(rating: Formatters.rating(rating)))
    }
}

/// The price symbol repeated `level` times, the rest up to 4 in `outline`.
struct PriceLevel: View {
    static let maxLevel = 4
    let level: Int
    var color = AppColors.onSurface
    var dimmed = AppColors.outline

    var body: some View {
        HStack(spacing: 0) {
            Text(String(repeating: Formatters.priceSymbol, count: max(0, min(level, Self.maxLevel))))
                .foregroundStyle(color)
            Text(String(repeating: Formatters.priceSymbol, count: max(0, Self.maxLevel - level)))
                .foregroundStyle(dimmed)
        }
        .font(AppTypography.label)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Strings.restaurantPriceLabel(level: level))
    }
}

/// A coloured dot and caption for today's availability.
struct AvailabilityIndicator: View {
    let availability: TodayAvailability
    var textColor = AppColors.onSurfaceVariant

    private var dotColor: Color {
        switch availability {
        case .available: AppColors.success
        case .full: AppColors.warning
        case .closed: AppColors.error
        }
    }

    var body: some View {
        HStack(spacing: AppSpacing.xs) {
            Circle().fill(dotColor).frame(width: AppSpacing.sm, height: AppSpacing.sm)
            Text(availability.label)
                .font(AppTypography.caption)
                .foregroundStyle(textColor)
        }
        .accessibilityElement(children: .combine)
    }
}

/// A selectable pill: `surface` with an `outline` hairline, or `espresso` when selected.
struct Chip: View {
    let label: String
    var icon: ImageResource?
    var trailingIcon: ImageResource?
    let isSelected: Bool
    var isEnabled = true
    var strikethrough = false
    let action: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.xs) {
                if let icon {
                    Image(icon).renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                }
                Text(label)
                    .font(AppTypography.label)
                    .strikethrough(strikethrough)
                    .lineLimit(1)
                if let trailingIcon {
                    Image(trailingIcon).renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.xs, height: AppIconSize.xs)
                }
            }
            .foregroundStyle(isSelected ? AppColors.onEspresso : AppColors.onSurface)
            .padding(.horizontal, AppSpacing.lg)
            .frame(minHeight: AppSize.chip)
            .background {
                Capsule().fill(isSelected ? AppColors.espresso : AppColors.surface)
            }
            .overlay {
                Capsule().strokeBorder(isSelected ? .clear : AppColors.accent.opacity(0.4), lineWidth: AppSize.hairline)
            }
            .frame(minHeight: AppSize.touchTarget)
            .contentShape(.rect)
        }
        .buttonStyle(.pressable)
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.4)
        .animation(AppMotion.reduced(AppMotion.snappy, reduceMotion), value: isSelected)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}
