import SwiftUI

struct SavedScreen: View {
    @Environment(AppContainer.self) private var container

    var body: some View {
        content(container.savedViewModel)
            .background(AppColors.background)
            .navigationTitle(Strings.savedTitle)
            .onAppear { container.savedViewModel.refresh() }
    }

    @ViewBuilder
    private func content(_ viewModel: SavedViewModel) -> some View {
        if viewModel.isEmpty {
            VStack(spacing: AppSpacing.md) {
                Text(Strings.savedEmptyTitle)
                    .font(AppTypography.headline)
                    .foregroundStyle(AppColors.onBackground)
                Text(Strings.savedEmptyBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .padding(AppSpacing.lg)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityIdentifier("saved.empty")
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.xl) {
                    if !viewModel.destinations.isEmpty {
                        VStack(alignment: .leading, spacing: AppSpacing.md) {
                            SectionHeader(title: Strings.savedDestinations)
                            ForEach(viewModel.destinations) { destination in
                                savedDestinationCard(destination, viewModel: viewModel)
                            }
                        }
                    }
                    if !viewModel.places.isEmpty {
                        VStack(alignment: .leading, spacing: AppSpacing.md) {
                            SectionHeader(title: Strings.savedPlaces)
                            ForEach(viewModel.places) { place in
                                savedPlaceCard(place, viewModel: viewModel)
                            }
                        }
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.bottom, AppSpacing.xxl)
            }
        }
    }

    private func savedDestinationCard(_ destination: Destination, viewModel: SavedViewModel) -> some View {
        ZStack(alignment: .topTrailing) {
            Button {
                viewModel.openDestination(destination)
            } label: {
                VStack(alignment: .leading, spacing: 0) {
                    RemoteImage(
                        urlString: destination.imageUrl,
                        fallbackURLString: viewModel.fallbackImageURL,
                        accessibilityName: destination.name
                    )
                    .frame(height: AppSize.cardImage)
                    .frame(maxWidth: .infinity)
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
            .cardAccessibility(label: destination.name, identifier: TestIDs.savedDestination(destination.id))

            HeartButton(
                isSaved: true,
                savedLabel: Strings.cityUnsave,
                unsavedLabel: Strings.citySave,
                identifier: TestIDs.savedUnsave(destination.id),
                onPhoto: true
            ) {
                viewModel.unsave(id: destination.id)
            }
        }
    }

    private func savedPlaceCard(_ place: Place, viewModel: SavedViewModel) -> some View {
        ZStack(alignment: .topTrailing) {
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
            .cardAccessibility(label: place.name, identifier: TestIDs.savedPlace(place.id))

            HeartButton(
                isSaved: true,
                savedLabel: Strings.placeUnsave,
                unsavedLabel: Strings.placeSave,
                identifier: TestIDs.savedUnsave(place.id),
                onPhoto: true
            ) {
                viewModel.unsave(id: place.id)
            }
        }
    }
}

#Preview {
    NavigationStack {
        SavedScreen()
    }
    .environment(AppContainer.preview())
}
