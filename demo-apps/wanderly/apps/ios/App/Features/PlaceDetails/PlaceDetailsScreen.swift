import SwiftUI

struct PlaceDetailsScreen: View {
    let placeId: String
    @Environment(AppContainer.self) private var container
    @State private var viewModel: PlaceDetailsViewModel?

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
                viewModel = PlaceDetailsViewModel(placeId: placeId, container: container)
            }
        }
    }

    @ViewBuilder
    private func content(_ viewModel: PlaceDetailsViewModel) -> some View {
        if let place = viewModel.place {
            placeContent(place, viewModel: viewModel)
        } else {
            errorState
        }
    }

    private var errorState: some View {
        VStack(spacing: AppSpacing.lg) {
            Text(Strings.placeErrorTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            Text(Strings.placeErrorBody)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
        }
        .padding(AppSpacing.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityIdentifier("place.error")
    }

    private func placeContent(_ place: Place, viewModel: PlaceDetailsViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                hero(place, viewModel: viewModel)
                facts(place, viewModel: viewModel)
                    .padding(.horizontal, AppSpacing.lg)
                Text(place.description)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onBackground)
                    .padding(.horizontal, AppSpacing.lg)
                actions(viewModel)
                    .padding(.horizontal, AppSpacing.lg)
                    .padding(.bottom, AppSpacing.xxl)
            }
        }
        .ignoresSafeArea(edges: .top)
        .sheet(isPresented: Bindable(viewModel).showTripSheet) {
            addToTripSheet(viewModel)
        }
        .overlay(alignment: .bottom) {
            if viewModel.showAddedBanner {
                Text(Strings.placeAdded)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onPrimary)
                    .padding(.horizontal, AppSpacing.lg)
                    .frame(minHeight: AppSize.touchTarget)
                    .background(AppColors.primary, in: Capsule())
                    .padding(.bottom, AppSpacing.xl)
                    .onAppear {
                        Task {
                            try? await Task.sleep(for: .seconds(2))
                            viewModel.showAddedBanner = false
                        }
                    }
            }
        }
    }

    private func hero(_ place: Place, viewModel: PlaceDetailsViewModel) -> some View {
        ZStack(alignment: .bottomLeading) {
            TabView {
                ForEach(place.heroURLs, id: \.self) { url in
                    RemoteImage(
                        urlString: url,
                        fallbackURLString: viewModel.fallbackImageURL,
                        accessibilityName: place.name
                    )
                }
            }
            .tabViewStyle(.page(indexDisplayMode: place.heroURLs.count > 1 ? .automatic : .never))
            .frame(height: AppSize.placeHero)
            PhotoScrim()
            OverlayTitle(title: place.name, subtitle: place.kind.label, display: true)
                .padding(AppSpacing.lg)
        }
        .frame(height: AppSize.placeHero)
        .clipShape(RoundedRectangle(cornerRadius: AppRadius.xl, style: .continuous))
        .padding(.horizontal, AppSpacing.lg)
        .shadow(AppElevation.low)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("place.hero")
    }

    private func facts(_ place: Place, viewModel: PlaceDetailsViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            HStack(spacing: AppSpacing.sm) {
                Image(AppIcon.star)
                    .resizable()
                    .scaledToFit()
                    .frame(width: AppIconSize.md, height: AppIconSize.md)
                    .foregroundStyle(AppColors.accent)
                Text(viewModel.ratingText(for: place))
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onBackground)
            }
            labeled(icon: AppIcon.mapPin, title: Strings.placeLocation, value: place.location)
            labeled(icon: AppIcon.clock, title: Strings.placeHours, value: place.openingHours)
            if place.durationMinutes > 0 {
                HStack(alignment: .top, spacing: AppSpacing.md) {
                    Image(AppIcon.ticket)
                        .resizable()
                        .scaledToFit()
                        .frame(width: AppIconSize.md, height: AppIconSize.md)
                        .foregroundStyle(AppColors.primary)
                    Text(viewModel.durationText(for: place))
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onBackground)
                }
            }
            if let price = viewModel.priceText(for: place) {
                HStack(alignment: .top, spacing: AppSpacing.md) {
                    Image(AppIcon.wallet)
                        .resizable()
                        .scaledToFit()
                        .frame(width: AppIconSize.md, height: AppIconSize.md)
                        .foregroundStyle(AppColors.primary)
                    Text(price)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onBackground)
                }
            }
        }
    }

    private func labeled(icon: ImageResource, title: String, value: String) -> some View {
        HStack(alignment: .top, spacing: AppSpacing.md) {
            Image(icon)
                .resizable()
                .scaledToFit()
                .frame(width: AppIconSize.md, height: AppIconSize.md)
                .foregroundStyle(AppColors.primary)
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(title)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Text(value)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onBackground)
            }
        }
    }

    private func actions(_ viewModel: PlaceDetailsViewModel) -> some View {
        HStack(spacing: AppSpacing.md) {
            HeartButton(
                isSaved: viewModel.isSaved,
                savedLabel: Strings.placeUnsave,
                unsavedLabel: Strings.placeSave,
                identifier: "place.save",
                action: viewModel.toggleSave
            )
            .background(AppColors.surface, in: Circle())
            Button(Strings.placeAddToTrip, action: viewModel.addToTripTapped)
                .buttonStyle(.primary)
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("place.addToTrip")
        }
    }

    private func addToTripSheet(_ viewModel: PlaceDetailsViewModel) -> some View {
        NavigationStack {
            Group {
                if viewModel.matchingTrips.isEmpty {
                    VStack(spacing: AppSpacing.lg) {
                        Text(Strings.placeAddToTripEmpty)
                            .font(AppTypography.body)
                            .foregroundStyle(AppColors.onSurface)
                            .multilineTextAlignment(.leading)
                        Button(Strings.placeStartTrip, action: viewModel.startTrip)
                            .buttonStyle(.primary)
                            .accessibilityIdentifier("place.startTrip")
                    }
                    .padding(AppSpacing.lg)
                } else {
                    List(viewModel.matchingTrips) { trip in
                        Button {
                            viewModel.add(to: trip)
                        } label: {
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text(trip.title)
                                    .font(AppTypography.title)
                                    .foregroundStyle(AppColors.onSurface)
                                Text(Strings.itineraryDates(start: AppFormat.mediumDate(trip.startDate), end: AppFormat.mediumDate(trip.endDate)))
                                    .font(AppTypography.caption)
                                    .foregroundStyle(AppColors.onSurfaceVariant)
                            }
                        }
                        .accessibilityIdentifier(TestIDs.placeTrip(trip.id))
                    }
                }
            }
            .navigationTitle(Strings.placeAddToTripTitle)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(Strings.commonCancel) {
                        viewModel.showTripSheet = false
                    }
                }
            }
        }
        .presentationDetents([.large])
    }
}

#Preview {
    NavigationStack {
        PlaceDetailsScreen(placeId: "paris-eiffel")
    }
    .environment(AppContainer.preview())
}
