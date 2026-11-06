import SwiftUI

/// The Filters sheet. Changes apply only when the apply button is tapped; dismissing discards them.
struct FiltersSheet: View {
    @Bindable var viewModel: ExploreViewModel
    let onApply: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.xl) {
                    Text(Strings.exploreFilters)
                        .font(AppSerif.display)
                        .foregroundStyle(AppColors.onBackground)
                        .accessibilityAddTraits(.isHeader)
                    section(Strings.exploreFilterCuisine) {
                        ForEach(CuisineId.allCases) { cuisine in
                            Chip(label: cuisine.label, isSelected: viewModel.draft.cuisines.contains(cuisine)) {
                                toggle(&viewModel.draft.cuisines, cuisine)
                            }
                            .accessibilityIdentifier("explore.filters.cuisine.\(cuisine.rawValue)")
                        }
                    }
                    section(Strings.exploreFilterNeighbourhood) {
                        ForEach(Array(viewModel.neighbourhoods.enumerated()), id: \.element) { index, neighbourhood in
                            Chip(label: neighbourhood, isSelected: viewModel.draft.neighbourhoods.contains(neighbourhood)) {
                                toggle(&viewModel.draft.neighbourhoods, neighbourhood)
                            }
                            .accessibilityIdentifier("explore.filters.neighbourhood.\(index)")
                        }
                    }
                    section(Strings.exploreFilterPrice) {
                        ForEach(ExploreFilters.priceLevelOptions, id: \.self) { level in
                            Chip(label: String(repeating: Formatters.priceSymbol, count: level), isSelected: viewModel.draft.priceLevels.contains(level)) {
                                toggle(&viewModel.draft.priceLevels, level)
                            }
                            .accessibilityLabel(Strings.restaurantPriceLabel(level: level))
                            .accessibilityIdentifier("explore.filters.price.\(level)")
                        }
                    }
                    section(Strings.exploreFilterRating) {
                        Chip(label: Strings.exploreFilterRatingAny, isSelected: viewModel.draft.minRating == nil) {
                            select { viewModel.draft.minRating = nil }
                        }
                        .accessibilityIdentifier("explore.filters.rating.any")
                        ForEach(ExploreFilters.ratingOptions, id: \.self) { rating in
                            Chip(label: Strings.exploreFilterRatingMin(rating: Formatters.rating(rating)), icon: AppIcon.starFilled, isSelected: viewModel.draft.minRating == rating) {
                                select { viewModel.draft.minRating = rating }
                            }
                            .accessibilityIdentifier("explore.filters.rating.\(ExploreFilters.ratingKey(rating))")
                        }
                    }
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        Overline(Strings.exploreFilterAvailableToday)
                        Toggle(isOn: Binding(
                            get: { viewModel.draft.availableToday },
                            set: { value in select { viewModel.draft.availableToday = value } }
                        )) {
                            Text(Strings.exploreFilterAvailableToday)
                                .font(AppTypography.subtitle)
                                .foregroundStyle(AppColors.onSurface)
                        }
                        .tint(AppColors.espresso)
                        .padding(.horizontal, AppSpacing.lg)
                        .frame(minHeight: AppSize.touchTarget + AppSpacing.sm)
                        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.md))
                        .accessibilityIdentifier("explore.filters.availableToday")
                    }
                    DemoNote()
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.top, AppSpacing.xl)
                .padding(.bottom, AppSpacing.lg)
            }
            footer
        }
        .background(AppColors.background.ignoresSafeArea())
    }

    private var footer: some View {
        HStack(spacing: AppSpacing.md) {
            Button {
                select { viewModel.clearDraft() }
            } label: {
                Text(Strings.exploreFilterClear)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.primary)
                    .padding(.horizontal, AppSpacing.md)
                    .frame(minHeight: AppSize.touchTarget)
            }
            .accessibilityIdentifier("explore.filters.clear")
            let count = viewModel.draftCount
            PrimaryButton(title: Strings.exploreFilterApply(count: count), action: onApply)
                .disabled(count == 0)
                .contentTransition(.numericText())
                .accessibilityIdentifier("explore.filters.apply")
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, AppSpacing.md)
        .glassSurface(cornerRadius: 0, strong: true)
    }

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Overline(title)
            FlowLayout { content() }
        }
    }

    private func select(_ change: () -> Void) {
        withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion), change)
    }

    private func toggle<Value: Hashable>(_ set: inout Set<Value>, _ value: Value) {
        withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion)) {
            if set.contains(value) { set.remove(value) } else { set.insert(value) }
        }
    }
}

#Preview {
    let session = MemberSession.preview()
    FiltersSheet(viewModel: ExploreViewModel(session: session)) {}
}
