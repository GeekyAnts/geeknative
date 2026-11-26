import SwiftUI

struct CityDetailsScreen: View {
    let destinationId: String
    @Environment(AppContainer.self) private var container
    @State private var viewModel: CityDetailsViewModel?

    init(destinationId: String) {
        self.destinationId = destinationId
    }

    var body: some View {
        ZStack {
            AppColors.background
            if let viewModel {
                content(viewModel)
            }
        }
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .onAppear {
            if viewModel == nil {
                viewModel = CityDetailsViewModel(destinationId: destinationId, container: container)
            }
        }
    }

    @ViewBuilder
    private func content(_ viewModel: CityDetailsViewModel) -> some View {
        if let destination = viewModel.destination {
            cityContent(destination, viewModel: viewModel)
        } else {
            errorState
        }
    }

    private var errorState: some View {
        VStack(spacing: AppSpacing.lg) {
            Text(Strings.cityErrorTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            Text(Strings.cityErrorBody)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
        }
        .padding(AppSpacing.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityIdentifier("city.error")
    }

    private func cityContent(_ destination: Destination, viewModel: CityDetailsViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                hero(destination, viewModel: viewModel)
                facts(destination, viewModel: viewModel)
                Text(destination.description)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onBackground)
                    .padding(.horizontal, AppSpacing.lg)

                placeRow(title: Strings.cityAttractions, identifier: "city.attractions", places: viewModel.attractions(), viewModel: viewModel)
                placeRow(title: Strings.cityHotels, identifier: "city.hotels", places: viewModel.hotels(), viewModel: viewModel)
                placeRow(title: Strings.cityRestaurants, identifier: "city.restaurants", places: viewModel.restaurants(), viewModel: viewModel)
                placeRow(title: Strings.cityActivities, identifier: "city.activities", places: viewModel.activities(), viewModel: viewModel)

                tips(destination)
                    .padding(.bottom, AppSpacing.xxl)
            }
        }
        .ignoresSafeArea(edges: .top)
        .safeAreaInset(edge: .bottom) {
            Button(Strings.cityPlanTrip, action: viewModel.planTrip)
                .buttonStyle(.primary)
                .frame(maxWidth: .infinity)
                .shadow(AppElevation.high)
                .accessibilityIdentifier("city.planTrip")
                .padding(.horizontal, AppSpacing.lg)
                .padding(.vertical, AppSpacing.md)
                .background(AppColors.background)
        }
    }

    private func hero(_ destination: Destination, viewModel: CityDetailsViewModel) -> some View {
        ZStack(alignment: .bottomLeading) {
            RemoteImage(
                urlString: destination.imageUrl,
                fallbackURLString: viewModel.fallbackImageURL,
                accessibilityName: destination.name
            )
            .frame(height: AppSize.hero)
            .frame(maxWidth: .infinity)
            PhotoScrim()
            HStack(alignment: .bottom) {
                OverlayTitle(title: destination.name, subtitle: destination.country, display: true)
                HeartButton(
                    isSaved: viewModel.isSaved,
                    savedLabel: Strings.cityUnsave,
                    unsavedLabel: Strings.citySave,
                    identifier: "city.save",
                    onPhoto: true,
                    action: viewModel.toggleSave
                )
            }
            .padding(AppSpacing.lg)
        }
        .frame(height: AppSize.hero)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
        .padding(.horizontal, AppSpacing.lg)
        .shadow(AppElevation.low)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("city.hero")
    }

    private func facts(_ destination: Destination, viewModel: CityDetailsViewModel) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(alignment: .top, spacing: AppSpacing.md) {
                factCard(icon: AppIcon.calendar, title: Strings.cityBestTime, value: destination.bestTimeToVisit)
                factCard(icon: AppIcon.sun, title: Strings.cityWeather, value: viewModel.weatherValue(for: destination))
                factCard(icon: AppIcon.wallet, title: Strings.cityCurrency, value: viewModel.currencyValue(for: destination))
                factCard(icon: AppIcon.languages, title: Strings.cityLanguage, value: destination.language)
            }
            .padding(.horizontal, AppSpacing.lg)
        }
    }

    private func factCard(icon: ImageResource, title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Image(icon)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.md, height: AppIconSize.md)
                .foregroundStyle(AppColors.primary)
            Text(title)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
            Text(value)
                .font(AppTypography.label)
                .foregroundStyle(AppColors.onSurface)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(AppSpacing.md)
        .frame(width: AppSize.thumb * 2, alignment: .leading)
        .background(AppColors.surface, in: RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
        .shadow(AppElevation.low)
    }

    private func placeRow(title: String, identifier: String, places: [Place], viewModel: CityDetailsViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: title)
                .padding(.horizontal, AppSpacing.lg)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.md) {
                    ForEach(places) { place in
                        NavigationLink(value: Route.place(placeId: place.id)) {
                            VStack(alignment: .leading, spacing: 0) {
                                RemoteImage(
                                    urlString: place.imageUrl,
                                    fallbackURLString: viewModel.fallbackImageURL,
                                    accessibilityName: place.name
                                )
                                .frame(width: AppSize.cardImage, height: AppSize.cardImage)
                                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                    Text(place.name)
                                        .font(AppTypography.title)
                                        .foregroundStyle(AppColors.onSurface)
                                        .lineLimit(2)
                                    HStack(spacing: AppSpacing.xs) {
                                        Image(AppIcon.star)
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                                            .foregroundStyle(AppColors.accent)
                                        Text(Strings.homeRatingLabel(rating: AppFormat.rating(place.rating)))
                                            .font(AppTypography.caption)
                                            .foregroundStyle(AppColors.onSurfaceVariant)
                                    }
                                }
                                .padding(AppSpacing.sm)
                                .frame(width: AppSize.cardImage, alignment: .leading)
                                .background(AppColors.surface)
                            }
                            .photoCardChrome()
                        }
                        .buttonStyle(.plain)
                        .contentShape(Rectangle())
                        .cardAccessibility(label: place.name, identifier: TestIDs.cityPlace(place.id))
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(identifier)
    }

    private func tips(_ destination: Destination) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.cityTips)
            ForEach(Array(destination.travelTips.enumerated()), id: \.offset) { _, tip in
                HStack(alignment: .top, spacing: AppSpacing.md) {
                    Image(AppIcon.info)
                        .resizable()
                        .scaledToFit()
                        .frame(width: AppIconSize.md, height: AppIconSize.md)
                        .foregroundStyle(AppColors.primary)
                    Text(tip)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurface)
                }
                .padding(AppSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(AppColors.surface, in: RoundedRectangle(cornerRadius: AppRadius.lg, style: .continuous))
            }
        }
        .padding(.horizontal, AppSpacing.lg)
    }
}

#Preview {
    NavigationStack {
        CityDetailsScreen(destinationId: "bali")
    }
    .environment(AppContainer.preview())
}
