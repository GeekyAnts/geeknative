import SwiftUI

struct HomeScreen: View {
    @Environment(AppContainer.self) private var container

    var body: some View {
        content(container.homeViewModel)
            .background(AppColors.background)
            .navigationTitle(AppIdentity.name)
    }

    @ViewBuilder
    private func content(_ viewModel: HomeViewModel) -> some View {
        if viewModel.loadFailed {
            errorState(viewModel)
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.xl) {
                    SearchField(
                        placeholder: Strings.homeSearchPlaceholder,
                        text: Bindable(viewModel).query,
                        identifier: "home.search",
                        onSubmit: viewModel.submitSearch
                    )

                    if let featured = viewModel.featured {
                        featuredCard(featured, viewModel: viewModel)
                    }

                    trendingSection(viewModel)
                    categoriesSection(viewModel)
                    popularSection(viewModel)
                    inspirationSection(viewModel)
                }
                .padding(.horizontal, AppSpacing.lg)
                .padding(.bottom, AppSpacing.xxl)
            }
        }
    }

    private func errorState(_ viewModel: HomeViewModel) -> some View {
        VStack(spacing: AppSpacing.lg) {
            Text(Strings.cityErrorTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            Text(Strings.cityErrorBody)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
            Button(Strings.commonRetry, action: viewModel.retry)
                .buttonStyle(.primary)
        }
        .padding(AppSpacing.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func featuredCard(_ destination: Destination, viewModel: HomeViewModel) -> some View {
        Button {
            viewModel.openCity(destination)
        } label: {
            ZStack(alignment: .bottomLeading) {
                RemoteImage(
                    urlString: destination.imageUrl,
                    fallbackURLString: viewModel.fallbackImageURL,
                    accessibilityName: destination.name
                )
                .frame(height: AppSize.featured)
                .frame(maxWidth: .infinity)
                PhotoScrim()
                OverlayTitle(
                    eyebrow: Strings.homeFeaturedLabel,
                    title: destination.name,
                    subtitle: destination.country,
                    display: true
                )
                .padding(AppSpacing.lg)
            }
            .frame(height: AppSize.featured)
            .photoCardChrome()
        }
        .buttonStyle(.plain)
        .cardAccessibility(label: destination.name, identifier: "home.featured")
    }

    private func trendingSection(_ viewModel: HomeViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.homeTrendingTitle)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.md) {
                    ForEach(viewModel.trending) { destination in
                        Button {
                            viewModel.openCity(destination)
                        } label: {
                            ZStack(alignment: .bottomLeading) {
                                RemoteImage(
                                    urlString: destination.imageUrl,
                                    fallbackURLString: viewModel.fallbackImageURL,
                                    accessibilityName: destination.name
                                )
                                .frame(width: AppSize.cardImage, height: AppSize.cardImage)
                                PhotoScrim()
                                OverlayTitle(title: destination.name)
                                    .padding(AppSpacing.md)
                            }
                            .frame(width: AppSize.cardImage, height: AppSize.cardImage)
                            .photoCardChrome()
                        }
                        .buttonStyle(.plain)
                        .cardAccessibility(label: destination.name, identifier: TestIDs.homeTrending(destination.id))
                    }
                }
            }
        }
    }

    private func categoriesSection(_ viewModel: HomeViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.homeCategoriesTitle)
            CategoryChipRow(selected: [], identifier: TestIDs.homeCategory, onTap: viewModel.selectCategory)
        }
    }

    private func popularSection(_ viewModel: HomeViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.homePopularTitle)
            ForEach(viewModel.popular) { place in
                Button {
                    viewModel.openPlace(place)
                } label: {
                    placeRow(place, destinationName: viewModel.destinationName(for: place), fallback: viewModel.fallbackImageURL)
                }
                .buttonStyle(.plain)
                .cardAccessibility(label: place.name, identifier: TestIDs.homePopular(place.id))
            }
        }
    }

    private func inspirationSection(_ viewModel: HomeViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.homeInspirationTitle)
            ForEach(viewModel.inspiration) { destination in
                Button {
                    viewModel.openCity(destination)
                } label: {
                    VStack(alignment: .leading, spacing: 0) {
                        ZStack(alignment: .bottomLeading) {
                            RemoteImage(
                                urlString: destination.imageUrl,
                                fallbackURLString: viewModel.fallbackImageURL,
                                accessibilityName: destination.name
                            )
                            .frame(height: AppSize.cardImage)
                            .frame(maxWidth: .infinity)
                            PhotoScrim()
                            OverlayTitle(title: destination.name, subtitle: destination.tagline)
                                .padding(AppSpacing.md)
                        }
                        .frame(height: AppSize.cardImage)
                        Text(destination.description)
                            .font(AppTypography.body)
                            .foregroundStyle(AppColors.onSurface)
                            .padding(AppSpacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(AppColors.surface)
                    }
                    .photoCardChrome()
                }
                .buttonStyle(.plain)
                .cardAccessibility(label: destination.name, identifier: TestIDs.homeInspiration(destination.id))
            }
        }
    }

    private func placeRow(_ place: Place, destinationName: String, fallback: String) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            RemoteImage(
                urlString: place.imageUrl,
                fallbackURLString: fallback,
                accessibilityName: place.name
            )
            .frame(height: AppSize.cardImage)
            .frame(maxWidth: .infinity)
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(place.name)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.onSurface)
                Text(destinationName)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                HStack(spacing: AppSpacing.xs) {
                    Image(AppIcon.star)
                        .resizable()
                        .scaledToFit()
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        .foregroundStyle(AppColors.accent)
                    Text(Strings.homeRatingLabel(rating: AppFormat.rating(place.rating)))
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurface)
                }
            }
            .padding(AppSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(AppColors.surface)
        }
        .photoCardChrome()
    }
}

#Preview {
    NavigationStack {
        HomeScreen()
    }
    .environment(AppContainer.preview())
}
