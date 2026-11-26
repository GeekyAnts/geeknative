import SwiftUI

struct SearchField: View {
    var placeholder: String
    @Binding var text: String
    var identifier: String
    var onSubmit: () -> Void

    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            Image(AppIcon.search)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.md, height: AppIconSize.md)
                .foregroundStyle(AppColors.onSurfaceVariant)
                .accessibilityHidden(true)
            TextField(placeholder, text: $text)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
                .submitLabel(.search)
                .onSubmit(onSubmit)
                .accessibilityIdentifier(identifier)
        }
        .padding(.horizontal, AppSpacing.md)
        .frame(minHeight: AppSize.touchTarget)
        .background(AppColors.surface, in: RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous)
                .stroke(AppColors.outline, lineWidth: 1)
        )
    }
}

struct CategoryChip: View {
    let category: TravelCategory
    var selected: Bool
    var identifier: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.xs) {
                Image(category.icon)
                    .resizable()
                    .scaledToFit()
                    .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                Text(category.label)
                    .font(AppTypography.label)
            }
            .foregroundStyle(selected ? AppColors.onPrimary : AppColors.onSurface)
            .padding(.horizontal, AppSpacing.md)
            .frame(minHeight: AppSize.touchTarget)
            .background(selected ? AppColors.primary : AppColors.surface, in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(identifier)
        .accessibilityAddTraits(selected ? [.isSelected] : [])
    }
}

struct CategoryChipRow: View {
    var selected: Set<String>
    var identifier: (String) -> String
    var onTap: (TravelCategory) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppSpacing.sm) {
                ForEach(TravelCategory.allCases) { item in
                    let category = item.rawValue
                    CategoryChip(
                        category: item,
                        selected: selected.contains(category),
                        identifier: identifier(category),
                        action: { onTap(item) }
                    )
                }
            }
        }
    }
}

struct HeartButton: View {
    var isSaved: Bool
    var savedLabel: String
    var unsavedLabel: String
    var identifier: String
    var onPhoto: Bool = false
    var action: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Button {
            withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) {
                action()
            }
        } label: {
            Image(AppIcon.saved)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.md, height: AppIconSize.md)
                .foregroundStyle(isSaved ? AppColors.accent : (onPhoto ? AppColors.onOverlay : AppColors.onSurfaceVariant))
                .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(isSaved ? savedLabel : unsavedLabel)
        .accessibilityIdentifier(identifier)
    }
}

struct BudgetBandRow: View {
    @Binding var selection: BudgetBand
    var identifier: (BudgetBand) -> String

    var body: some View {
        HStack(spacing: AppSpacing.sm) {
            ForEach(BudgetBand.allCases) { band in
                let selected = selection == band
                Button {
                    selection = band
                } label: {
                    Text(band.label)
                        .font(AppTypography.label)
                        .foregroundStyle(selected ? AppColors.onPrimary : AppColors.onSurface)
                        .padding(.horizontal, AppSpacing.md)
                        .frame(minHeight: AppSize.touchTarget)
                        .frame(maxWidth: .infinity)
                        .background(selected ? AppColors.primary : AppColors.surface, in: Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier(identifier(band))
                .accessibilityAddTraits(selected ? [.isSelected] : [])
            }
        }
    }
}

struct TravelersStepper: View {
    @Binding var value: Int
    var identifier: String

    var body: some View {
        HStack(spacing: AppSpacing.md) {
            Button {
                value = max(1, value - 1)
            } label: {
                Image(AppIcon.chevronDown)
                    .resizable()
                    .scaledToFit()
                    .frame(width: AppIconSize.md, height: AppIconSize.md)
                    .foregroundStyle(AppColors.onSurface)
                    .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(value <= 1)
            .accessibilityLabel(Strings.commonDecrease)

            Text(Strings.plannerTravelersValue(count: AppFormat.int(value)))
                .font(AppTypography.title)
                .foregroundStyle(AppColors.onSurface)
                .accessibilityIdentifier(identifier)

            Button {
                value = min(8, value + 1)
            } label: {
                Image(AppIcon.plus)
                    .resizable()
                    .scaledToFit()
                    .frame(width: AppIconSize.md, height: AppIconSize.md)
                    .foregroundStyle(AppColors.onSurface)
                    .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(value >= 8)
            .accessibilityLabel(Strings.commonIncrease)
        }
    }
}

struct SectionHeader: View {
    let title: String

    var body: some View {
        Text(title)
            .font(AppTypography.headline)
            .foregroundStyle(AppColors.onBackground)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct OverlayTitle: View {
    var eyebrow: String? = nil
    var title: String
    var subtitle: String? = nil
    var display: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            if let eyebrow {
                Text(eyebrow)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onOverlay)
            }
            Text(title)
                .font(display ? AppTypography.display : AppTypography.title)
                .foregroundStyle(AppColors.onOverlay)
            if let subtitle {
                Text(subtitle)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onOverlay)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension View {
    func photoCardChrome() -> some View {
        self
            .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
            .shadow(AppElevation.low)
    }

    func hideTabBarOnPush() -> some View {
        toolbar(.hidden, for: .tabBar)
    }

    func cardAccessibility(label: String, identifier: String) -> some View {
        accessibilityElement(children: .ignore)
            .accessibilityLabel(label)
            .accessibilityIdentifier(identifier)
            .accessibilityAddTraits(.isButton)
    }
}
