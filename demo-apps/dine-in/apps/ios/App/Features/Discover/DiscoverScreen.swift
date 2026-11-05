import SwiftUI

/// The editorial home: greeting, hero, search entry, next evening, cuisines, collections, the
/// concierge's pick, recommendations and featured restaurants.
struct DiscoverScreen: View {
    @State private var viewModel: DiscoverViewModel
    @State private var scroll = ScrollOffset()
    @Environment(AppRouter.self) private var router

    init(viewModel: DiscoverViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xxl) {
                greetingBar
                    .onScrollOffsetChange { scroll.update($0) }
                switch viewModel.state {
                case .loading:
                    DiscoverSkeleton()
                case .failed:
                    ErrorState { Task { await viewModel.retry() } }
                case .loaded(let catalog):
                    content(catalog)
                }
            }
            .padding(.top, AppSpacing.sm)
            .tabBarClearance()
        }
        .scrollIndicators(.hidden)
        .clubBackground()
        .task { await viewModel.load() }
    }

    // MARK: - Sections

    private var greetingBar: some View {
        HStack(spacing: AppSpacing.md) {
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Overline(Strings.brandTagline)
                Text(viewModel.greeting)
                    .font(AppSerif.title)
                    .foregroundStyle(AppColors.onBackground)
                    .lineLimit(2)
                    .accessibilityIdentifier("discover.greeting")
                HStack(spacing: AppSpacing.xs) {
                    Image(AppIcon.location)
                        .renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.xs, height: AppIconSize.xs)
                    Text(Strings.discoverLocation)
                        .font(AppTypography.caption)
                }
                .foregroundStyle(AppColors.onSurfaceVariant)
            }
            Spacer(minLength: 0)
            GlassIconButton(icon: AppIcon.bell, label: Strings.discoverNotifications) {
                router.push(.notifications)
            }
            .overlay(alignment: .topTrailing) {
                if viewModel.hasReminders {
                    Circle()
                        .fill(AppColors.accent)
                        .frame(width: AppSpacing.sm, height: AppSpacing.sm)
                        .offset(x: -AppSpacing.md, y: AppSpacing.md)
                        .allowsHitTesting(false)
                }
            }
            .accessibilityIdentifier("discover.notifications")
            Button {
                router.switchTab(.profile)
            } label: {
                Text(viewModel.initials)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onEspresso)
                    .frame(width: AppSize.avatar, height: AppSize.avatar)
                    .background(AppColors.espresso, in: .circle)
                    .overlay(Circle().strokeBorder(AppColors.accent.opacity(0.7), lineWidth: 2))
                    .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                    .contentShape(.circle)
            }
            .buttonStyle(.pressable)
            .accessibilityLabel(Strings.discoverOpenProfile)
            .accessibilityIdentifier("discover.avatar")
        }
        .padding(.horizontal, AppSpacing.lg)
    }

    @ViewBuilder
    private func content(_ catalog: Catalog) -> some View {
        heroAndSearch(catalog).reveal(0)
        if let next = viewModel.nextReservation, let restaurant = catalog.restaurant(next.restaurantId) {
            upcoming(next, restaurant).reveal(1)
        }
        cuisines(catalog).reveal(2, onScroll: true)
        collections(catalog).reveal(3, onScroll: true)
        if let spotlight = viewModel.spotlight(catalog) {
            spotlightBand(spotlight).reveal(0, onScroll: true)
        }
        let recommended = viewModel.recommended(catalog)
        if !recommended.isEmpty {
            carousel(
                overline: Strings.discoverRecommendedOverline,
                title: Strings.discoverRecommendedTitle,
                restaurants: recommended,
                testIDPrefix: "discover.recommended."
            )
            .reveal(0, onScroll: true)
        }
        carousel(
            overline: Strings.discoverFeaturedOverline,
            title: Strings.discoverFeaturedTitle,
            restaurants: viewModel.featured(catalog),
            testIDPrefix: "discover.featured.",
            onSeeAll: { router.openExplore(ExploreRequest()) }
        )
        .reveal(0, onScroll: true)
        DemoNote()
            .padding(.horizontal, AppSpacing.lg)
    }

    private func heroAndSearch(_ catalog: Catalog) -> some View {
        VStack(spacing: -AppSize.button / 2) {
            ZStack(alignment: .bottomLeading) {
                ParallaxPhoto(url: catalog.heroImage, scroll: scroll, height: AppSize.heroHeight)
                    .opacity(0.6)
                AppColors.espresso.opacity(0.5)
                    .allowsHitTesting(false)
                PhotoScrim()
                VStack(alignment: .leading, spacing: AppSpacing.md) {
                    Overline(Strings.discoverHeroOverline, color: AppColors.onGlassOnImage)
                    GoldRule()
                    Text(Strings.discoverHeroTitle)
                        .font(AppSerif.hero)
                        .foregroundStyle(AppColors.onGlassOnImage)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(Strings.discoverHeroBody)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onGlassOnImage.opacity(0.9))
                        .fixedSize(horizontal: false, vertical: true)
                    Button {
                        router.openExplore(ExploreRequest())
                    } label: {
                        HStack(spacing: AppSpacing.sm) {
                            Text(Strings.discoverHeroCta).font(AppTypography.label)
                            Image(AppIcon.chevronRight)
                                .renderingMode(.template).resizable().scaledToFit()
                                .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        }
                        .foregroundStyle(AppColors.onGlassOnImage)
                        .padding(.horizontal, AppSpacing.lg)
                        .frame(minHeight: AppSize.touchTarget)
                        .background(AppColors.glassOnImage, in: .capsule)
                        .background(.ultraThinMaterial, in: .capsule)
                        .overlay(Capsule().strokeBorder(AppColors.glassBorder, lineWidth: AppSize.hairline))
                    }
                    .buttonStyle(.pressable)
                    .accessibilityIdentifier("discover.heroCta")
                }
                .padding(AppSpacing.xl)
                .padding(.bottom, AppSize.button / 2)
            }
            .frame(height: AppSize.heroHeight)
            .clipShape(.rect(cornerRadius: AppRadius.xl, style: .continuous))
            .padding(.horizontal, AppSpacing.lg)

            Button {
                router.openExplore(ExploreRequest(focusSearch: true))
            } label: {
                HStack(spacing: AppSpacing.md) {
                    Image(AppIcon.search)
                        .renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.md, height: AppIconSize.md)
                        .foregroundStyle(AppColors.primary)
                    Text(Strings.discoverSearchPlaceholder)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, AppSpacing.lg)
                .frame(height: AppSize.button)
                .glassCapsule(floating: true, strong: true)
            }
            .buttonStyle(.pressable)
            .padding(.horizontal, AppSpacing.xl)
            .accessibilityIdentifier("discover.search")
        }
    }

    private func upcoming(_ reservation: Reservation, _ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Overline(Strings.discoverUpcomingOverline)
            Button {
                router.push(.reservation(reservation.id))
            } label: {
                HStack(spacing: AppSpacing.md) {
                    RemoteImage(url: restaurant.heroImage, label: restaurant.name)
                        .frame(width: AppSize.thumbnail, height: AppSize.thumbnail)
                        .clipShape(.rect(cornerRadius: AppRadius.md, style: .continuous))
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text(restaurant.name)
                            .font(AppSerif.title)
                            .foregroundStyle(AppColors.onEspresso)
                            .lineLimit(1)
                        Text(Formatters.dateAndTime(iso: reservation.date, time: reservation.time))
                            .font(AppTypography.label)
                            .foregroundStyle(AppColors.onEspresso)
                        Text(Strings.reserveGuestCount(count: reservation.partySize))
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.onEspresso.opacity(0.8))
                    }
                    .multilineTextAlignment(.leading)
                    Spacer(minLength: 0)
                    Image(AppIcon.chevronRight)
                        .renderingMode(.template).resizable().scaledToFit()
                        .frame(width: AppIconSize.md, height: AppIconSize.md)
                        .foregroundStyle(AppColors.accent)
                }
                .padding(AppSpacing.md)
                .background(AppColors.espresso, in: .rect(cornerRadius: AppRadius.lg, style: .continuous))
            }
            .buttonStyle(.pressable)
            .accessibilityIdentifier("discover.upcoming")
        }
        .padding(.horizontal, AppSpacing.lg)
    }

    private func cuisines(_ catalog: Catalog) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(overline: Strings.discoverCuisinesOverline, title: Strings.discoverCuisinesTitle)
                .padding(.horizontal, AppSpacing.lg)
            ScrollView(.horizontal) {
                HStack(spacing: AppSpacing.sm) {
                    ForEach(catalog.cuisines) { cuisine in
                        Chip(label: cuisine.label, isSelected: false) {
                            router.openExplore(ExploreRequest(cuisine: cuisine))
                        }
                        .accessibilityIdentifier("discover.cuisine.\(cuisine.rawValue)")
                    }
                }
            }
            .contentMargins(.horizontal, AppSpacing.lg, for: .scrollContent)
            .scrollIndicators(.hidden)
        }
    }

    private func collections(_ catalog: Catalog) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(overline: Strings.discoverCollectionsOverline, title: Strings.discoverCollectionsTitle)
                .padding(.horizontal, AppSpacing.lg)
            ScrollView(.horizontal) {
                HStack(spacing: AppSpacing.md) {
                    ForEach(catalog.collections) { collection in
                        CollectionCard(collection: collection, testID: "discover.collection.\(collection.id.rawValue)") {
                            router.openExplore(ExploreRequest(collection: collection.id))
                        }
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .contentMargins(.horizontal, AppSpacing.lg, for: .scrollContent)
            .scrollIndicators(.hidden)
        }
    }

    private func spotlightBand(_ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            Overline(Strings.discoverSpotlightOverline)
            Text(restaurant.name)
                .font(AppSerif.display)
                .foregroundStyle(AppColors.onEspresso)
            Text(restaurant.tagline)
                .font(AppSerif.italic(.title))
                .foregroundStyle(AppColors.accent)
                .fixedSize(horizontal: false, vertical: true)
            RemoteImage(url: restaurant.gallery.dropFirst().first ?? restaurant.heroImage, label: restaurant.name)
                .aspectRatio(4 / 3, contentMode: .fit)
                .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
            Text(DiscoverViewModel.firstSentences(restaurant.about))
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onEspresso.opacity(0.8))
                .fixedSize(horizontal: false, vertical: true)
            SecondaryButton(title: Strings.discoverSpotlightCta, tint: AppColors.onEspresso) {
                router.push(.restaurant(restaurant.id))
            }
            .accessibilityIdentifier("discover.spotlight")
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, AppSpacing.xxl)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AppColors.espresso)
    }

    private func carousel(overline: String, title: String, restaurants: [Restaurant], testIDPrefix: String, onSeeAll: (() -> Void)? = nil) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(overline: overline, title: title, onSeeAll: onSeeAll)
                .padding(.horizontal, AppSpacing.lg)
            ScrollView(.horizontal) {
                HStack(spacing: AppSpacing.md) {
                    ForEach(restaurants) { restaurant in
                        RestaurantCard(restaurant: restaurant, availability: viewModel.availability(restaurant), testID: testIDPrefix + restaurant.id) {
                            router.push(.restaurant(restaurant.id))
                        }
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .contentMargins(.horizontal, AppSpacing.lg, for: .scrollContent)
            .scrollIndicators(.hidden)
        }
    }
}

/// Skeletons shaped like the hero, one chip row and one card carousel.
private struct DiscoverSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxl) {
            Skeleton(cornerRadius: AppRadius.xl)
                .frame(height: AppSize.heroHeight)
                .padding(.horizontal, AppSpacing.lg)
            HStack(spacing: AppSpacing.sm) {
                ForEach(0..<4, id: \.self) { _ in
                    Skeleton(cornerRadius: AppRadius.full).frame(width: AppSize.thumbnail, height: AppSize.chip)
                }
            }
            .padding(.horizontal, AppSpacing.lg)
            HStack(spacing: AppSpacing.md) {
                ForEach(0..<2, id: \.self) { _ in
                    Skeleton(cornerRadius: AppRadius.xl).frame(width: AppSize.featuredCardWidth, height: AppSize.featuredCardHeight)
                }
            }
            .padding(.horizontal, AppSpacing.lg)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Strings.commonLoading)
    }
}

#Preview {
    let session = MemberSession.preview()
    DiscoverScreen(viewModel: DiscoverViewModel(session: session))
        .environment(session)
        .environment(session.router)
}
