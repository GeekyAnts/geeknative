import SwiftUI
import UIKit

struct DestinationsScreen: View {
    @Environment(AppContainer.self) private var container
    @Environment(AppNavigation.self) private var navigation
    @State private var viewModel = DestinationsViewModel(repository: InMemoryWeddingRepository())
    @State private var didLoad = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                Text(Strings.destinationsBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                filters
                seasonal
                results
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.background)
        .navigationTitle(Strings.destinationsTitle)
        .onAppear {
            if !didLoad {
                didLoad = true
                viewModel = DestinationsViewModel(repository: container.weddingRepository)
            } else {
                viewModel.syncFromPlan()
            }
        }
        .onChange(of: navigation.selectedTab) { _, tab in
            if tab == .destinations {
                viewModel.syncFromPlan()
            }
        }
    }

    private var filters: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.destinationsFilterTitle)
                .font(AppTypography.label)
                .foregroundStyle(AppColors.onSurfaceVariant)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.sm) {
                    styleChip(nil, Strings.styleAll)
                    ForEach(WeddingStyle.allCases) { style in
                        styleChip(style, style.label)
                    }
                }
            }
            .testIdentifier(testId: "destinations.filter.style")
            filterField(Strings.destinationsFilterLocation, text: $viewModel.location, keyboard: .default)
            filterField(Strings.destinationsFilterGuests, text: $viewModel.guests, keyboard: .numberPad)
                .accessibilityIdentifier("destinations.filter.guests")
            filterField(Strings.destinationsFilterBudget, text: $viewModel.budget, keyboard: .numberPad)
                .accessibilityIdentifier("destinations.filter.budget")
        }
    }

    private func styleChip(_ style: WeddingStyle?, _ title: String) -> some View {
        let active = viewModel.style == style
        return Button(title) {
            viewModel.style = style
        }
        .font(AppTypography.label)
        .foregroundStyle(active ? AppColors.onPrimary : AppColors.onSurface)
        .padding(.horizontal, AppSpacing.lg)
        .frame(minHeight: AppSize.touchTarget)
        .background(active ? AppColors.primary : AppColors.surfaceVariant, in: .capsule)
    }

    private var seasonal: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.destinationsSeasonalTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            ForEach(viewModel.seasonal) { destination in
                NavigationLink(value: Route.destination(destination.id)) {
                    HStack(spacing: AppSpacing.md) {
                        CatalogPhoto(urlString: destination.imageUrl)
                            .frame(width: 96, height: 96)
                            .clipShape(.rect(cornerRadius: AppRadius.md))
                        VStack(alignment: .leading, spacing: AppSpacing.xs) {
                            Text(destination.name)
                                .font(AppTypography.title)
                                .foregroundStyle(AppColors.onSurface)
                            Text(destination.seasonalNote)
                                .font(AppTypography.body)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                                .lineLimit(3)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder
    private var results: some View {
        if viewModel.results.isEmpty {
            AppCard {
                Text(Strings.destinationsEmptyTitle)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.onSurface)
                Text(Strings.destinationsEmptyBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .accessibilityIdentifier("destinations.empty")
        } else {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                ForEach(viewModel.results) { destination in
                    NavigationLink(value: Route.destination(destination.id)) {
                        destinationCard(destination)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("destinations.card.\(destination.id)")
                }
            }
            .testIdentifier(testId: "destinations.list")
        }
    }

    private func destinationCard(_ destination: Destination) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            CatalogPhoto(urlString: destination.imageUrl)
                .frame(height: 200)
                .frame(maxWidth: .infinity)
                .overlay(alignment: .bottomLeading) {
                    Text(destination.name)
                        .font(AppTypography.headline)
                        .foregroundStyle(AppColors.inverse)
                        .padding(AppSpacing.md)
                }
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Text(destination.country)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.tertiary)
                Text(destination.tagline)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.primary)
                Text(destination.description)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Text(
                    Strings.destinationsCapacity(count: destination.guestCapacityMax)
                        + " · "
                        + Strings.destinationsBudgetFrom(amount: CatalogFormat.amount(destination.budgetMin))
                )
                .font(AppTypography.label)
                .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.xl))
        .shadow(AppElevation.high)
    }

    private func filterField(_ title: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text(title)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
            AppTextField(prompt: title, text: text, keyboard: keyboard)
                .padding(.horizontal, AppSpacing.md)
                .frame(minHeight: AppSize.touchTarget)
                .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.sm))
                .overlay {
                    RoundedRectangle(cornerRadius: AppRadius.sm)
                        .stroke(AppColors.outline)
                }
                .onChange(of: text.wrappedValue) { _, _ in
                    viewModel.persistFilters()
                }
        }
    }
}

#Preview {
    NavigationStack {
        DestinationsScreen()
    }
    .environment(AppContainer.preview())
    .environment(AppNavigation())
}
