import SwiftUI

struct ExploreScreen: View {
    @Environment(AppContainer.self) private var container
    var initialQuery: String? = nil
    var initialCategory: String? = nil
    var isolated: Bool = false
    @State private var isolatedViewModel: ExploreViewModel?

    var body: some View {
        content(activeViewModel)
            .background(AppColors.background)
            .navigationTitle(Strings.exploreTitle)
            .onAppear {
                if isolated, isolatedViewModel == nil {
                    isolatedViewModel = ExploreViewModel(
                        container: container,
                        initialQuery: initialQuery,
                        initialCategory: initialCategory,
                        isolated: true
                    )
                }
                activeViewModel.syncFromNavigation()
            }
            .onChange(of: container.navigation.exploreQuery) { _, _ in
                activeViewModel.syncFromNavigation()
            }
            .onChange(of: container.navigation.exploreCategory) { _, _ in
                activeViewModel.syncFromNavigation()
            }
            .onChange(of: container.navigation.selectedTab) { _, _ in
                activeViewModel.syncFromNavigation()
            }
    }

    private var activeViewModel: ExploreViewModel {
        isolatedViewModel ?? container.exploreViewModel
    }

    @ViewBuilder
    private func content(_ viewModel: ExploreViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                SearchField(
                    placeholder: Strings.exploreSearchPlaceholder,
                    text: Bindable(viewModel).query,
                    identifier: "explore.search",
                    onSubmit: viewModel.commitQuery
                )
                .onChange(of: viewModel.query) { _, _ in
                    viewModel.commitQuery()
                }

                VStack(alignment: .leading, spacing: AppSpacing.md) {
                    SectionHeader(title: Strings.exploreFiltersTitle)
                    CategoryChipRow(
                        selected: Set([viewModel.category].compactMap { $0 }),
                        identifier: TestIDs.exploreCategory,
                        onTap: viewModel.toggleCategory
                    )
                }

                if viewModel.isEmpty {
                    emptyState(viewModel)
                } else {
                    if !viewModel.destinations.isEmpty {
                        destinationGrid(viewModel)
                    }
                    if !viewModel.places.isEmpty {
                        placesList(viewModel)
                    }
                }
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.bottom, AppSpacing.xxl)
        }
    }

    private func emptyState(_ viewModel: ExploreViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.exploreEmptyTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            Text(Strings.exploreEmptyBody)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
            Button(Strings.exploreClearFilters, action: viewModel.clearFilters)
                .buttonStyle(.primary)
                .accessibilityIdentifier("explore.clearFilters")
        }
        .accessibilityIdentifier("explore.empty")
        .padding(.vertical, AppSpacing.xl)
    }

    private func destinationGrid(_ viewModel: ExploreViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.exploreDestinationsTitle)
            LazyVGrid(columns: [GridItem(.flexible(), spacing: AppSpacing.md), GridItem(.flexible(), spacing: AppSpacing.md)], spacing: AppSpacing.md) {
                ForEach(viewModel.destinations) { destination in
                    Button {
                        viewModel.openCity(destination)
                    } label: {
                        VStack(alignment: .leading, spacing: 0) {
                            RemoteImage(
                                urlString: destination.imageUrl,
                                fallbackURLString: viewModel.fallbackImageURL,
                                accessibilityName: destination.name
                            )
                            .frame(height: AppSize.cardImage)
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text(destination.name)
                                    .font(AppTypography.title)
                                    .foregroundStyle(AppColors.onSurface)
                                Text(destination.country)
                                    .font(AppTypography.caption)
                                    .foregroundStyle(AppColors.onSurfaceVariant)
                            }
                            .padding(AppSpacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(AppColors.surface)
                        }
                        .photoCardChrome()
                    }
                    .buttonStyle(.plain)
                    .cardAccessibility(label: destination.name, identifier: TestIDs.exploreDestination(destination.id))
                }
            }
        }
    }

    private func placesList(_ viewModel: ExploreViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.explorePlacesTitle)
            ForEach(viewModel.places) { place in
                Button {
                    viewModel.openPlace(place)
                } label: {
                    VStack(alignment: .leading, spacing: 0) {
                        RemoteImage(
                            urlString: place.imageUrl,
                            fallbackURLString: viewModel.fallbackImageURL,
                            accessibilityName: place.name
                        )
                        .frame(height: AppSize.cardImage)
                        .frame(maxWidth: .infinity)
                        VStack(alignment: .leading, spacing: AppSpacing.xs) {
                            Text(place.name)
                                .font(AppTypography.title)
                                .foregroundStyle(AppColors.onSurface)
                            Text(place.kind.label)
                                .font(AppTypography.label)
                                .foregroundStyle(AppColors.primary)
                            Text(viewModel.destinationName(for: place))
                                .font(AppTypography.caption)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                        }
                        .padding(AppSpacing.md)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(AppColors.surface)
                    }
                    .photoCardChrome()
                }
                .buttonStyle(.plain)
                .cardAccessibility(label: place.name, identifier: TestIDs.explorePlace(place.id))
            }
        }
    }
}

#Preview {
    NavigationStack {
        ExploreScreen()
    }
    .environment(AppContainer.preview())
}
