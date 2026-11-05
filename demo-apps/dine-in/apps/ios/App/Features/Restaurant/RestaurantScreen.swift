import SwiftUI

/// The immersive restaurant profile with a floating Reserve bar.
struct RestaurantScreen: View {
    @State private var viewModel: RestaurantViewModel
    @State private var scroll = ScrollOffset()
    @State private var scrolled = false
    @State private var barShown = false
    @Environment(AppRouter.self) private var router
    @Environment(\.openURL) private var openURL
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(viewModel: RestaurantViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        Group {
            switch viewModel.state {
            case .loading:
                loading
            case .failed:
                VStack { ErrorState { Task { await viewModel.load() } } }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .overlay(alignment: .top) { TopBar() }
            case .notFound:
                VStack {
                    EmptyState(icon: AppIcon.utensils, title: Strings.restaurantNotFoundTitle, message: Strings.restaurantNotFoundBody)
                        .accessibilityIdentifier("restaurant.notFound")
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .overlay(alignment: .top) { TopBar() }
            case .loaded(let restaurant):
                loaded(restaurant)
            }
        }
        .background(AppColors.background.ignoresSafeArea())
        .task { await viewModel.load() }
    }

    private var loading: some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            Skeleton(cornerRadius: 0).frame(height: AppSize.detailHeroHeight)
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                Skeleton().frame(width: AppSize.collectionCardWidth, height: AppTextSize.headline)
                Skeleton().frame(height: AppTextSize.body)
                Skeleton().frame(width: AppSize.featuredCardWidth, height: AppTextSize.body)
            }
            .padding(.horizontal, AppSpacing.lg)
            Spacer()
        }
        .ignoresSafeArea(edges: .top)
        .overlay(alignment: .top) { TopBar(overImage: true) }
    }

    private func loaded(_ restaurant: Restaurant) -> some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    RestaurantGallery(restaurant: restaurant, scroll: scroll)
                        .onScrollOffsetChange { scroll.update($0) }
                        .trackScrolled($scrolled, threshold: AppSize.detailHeroHeight - AppSize.touchTarget * 2)
                    details(restaurant)
                        .padding(.top, AppSpacing.xl)
                        .padding(.bottom, AppSize.button + AppSpacing.huge)
                        .background(AppColors.background, in: UnevenRoundedRectangle(topLeadingRadius: AppRadius.xl, topTrailingRadius: AppRadius.xl, style: .continuous))
                        .padding(.top, -AppSpacing.xl)
                }
            }
            .scrollIndicators(.hidden)
            .ignoresSafeArea(edges: .top)

            TopBar(title: restaurant.name, isScrolled: scrolled, overImage: true) {
                FavouriteButton(restaurantId: restaurant.id, onImage: !scrolled)
            }
        }
        .overlay(alignment: .bottom) {
            reserveBar(restaurant)
                .offset(y: barShown || reduceMotion ? 0 : AppSize.button * 3)
                .opacity(barShown || reduceMotion ? 1 : 0)
        }
        .onAppear {
            withAnimation(AppMotion.reduced(AppMotion.gentle.delay(AppMotion.fast), reduceMotion)) { barShown = true }
        }
    }

    // MARK: - Sections

    private func details(_ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xxl) {
            titleBlock(restaurant).reveal(0)
            section(Strings.restaurantAbout) {
                Text(restaurant.about)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurface)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("restaurant.about")
            }
            .reveal(1)
            section(Strings.restaurantAmbience) {
                Text(restaurant.ambience)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurface)
                    .fixedSize(horizontal: false, vertical: true)
                RemoteImage(url: restaurant.gallery.dropFirst().first ?? restaurant.heroImage, label: restaurant.name)
                    .aspectRatio(16 / 10, contentMode: .fit)
                    .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
            }
            .reveal(2)
            dishes(restaurant).reveal(0, onScroll: true)
            menu(restaurant).reveal(0, onScroll: true)
            hours(restaurant).reveal(0, onScroll: true)
            location(restaurant).reveal(0, onScroll: true)
            amenities(restaurant).reveal(0, onScroll: true)
            if let dressCode = restaurant.dressCode {
                section(Strings.restaurantDressCode) {
                    HStack(alignment: .top, spacing: AppSpacing.md) {
                        icon(AppIcon.dressCode, size: AppIconSize.md, color: AppColors.accent)
                        Text(dressCode)
                            .font(AppTypography.body)
                            .foregroundStyle(AppColors.onSurface)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            reviews(restaurant).reveal(0, onScroll: true)
            DemoNote().padding(.horizontal, AppSpacing.lg)
        }
    }

    private func titleBlock(_ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Overline(restaurant.cuisine.label)
            Text(restaurant.name)
                .font(AppSerif.headline)
                .foregroundStyle(AppColors.onBackground)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("restaurant.name")
            Text(restaurant.tagline)
                .font(AppSerif.italic(.title))
                .foregroundStyle(AppColors.onSurfaceVariant)
                .fixedSize(horizontal: false, vertical: true)
            FlowLayout(spacing: AppSpacing.md) {
                RatingBadge(rating: restaurant.rating)
                Text(Formatters.reviewCount(restaurant.reviewCount))
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                PriceLevel(level: restaurant.priceLevel)
                Text(Strings.restaurantCostForTwo(price: Formatters.price(restaurant.costForTwo)))
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            HStack(spacing: AppSpacing.xs) {
                icon(AppIcon.location, size: AppIconSize.sm, color: AppColors.primary)
                Text(Strings.formatSeparator(first: restaurant.neighbourhood, second: Formatters.distance(restaurant.distanceKm)))
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onSurface)
            }
            if let availability = viewModel.availability {
                AvailabilityIndicator(availability: availability)
            }
        }
        .padding(.horizontal, AppSpacing.lg)
    }

    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: title)
            content()
        }
        .padding(.horizontal, AppSpacing.lg)
    }

    private func dishes(_ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.restaurantSignatureDishes)
                .padding(.horizontal, AppSpacing.lg)
            ScrollView(.horizontal) {
                HStack(alignment: .top, spacing: AppSpacing.md) {
                    ForEach(restaurant.signatureDishes, id: \.name) { dish in
                        VStack(alignment: .leading, spacing: AppSpacing.sm) {
                            RemoteImage(url: dish.image, label: dish.name)
                                .frame(width: AppSize.dishCardWidth, height: AppSize.dishCardWidth)
                                .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
                            Text(dish.name)
                                .font(AppSerif.title)
                                .foregroundStyle(AppColors.onBackground)
                                .lineLimit(2)
                            Text(dish.description)
                                .font(AppTypography.caption)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                                .lineLimit(2, reservesSpace: true)
                            Text(Formatters.price(dish.price))
                                .font(AppTypography.label)
                                .foregroundStyle(AppColors.primary)
                        }
                        .frame(width: AppSize.dishCardWidth, alignment: .leading)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .contentMargins(.horizontal, AppSpacing.lg, for: .scrollContent)
            .scrollIndicators(.hidden)
        }
    }

    private func menu(_ restaurant: Restaurant) -> some View {
        section(Strings.restaurantMenuHighlights) {
            VStack(spacing: 0) {
                ForEach(Array(restaurant.menuHighlights.enumerated()), id: \.offset) { index, item in
                    if index > 0 {
                        Rectangle().fill(AppColors.outline).frame(height: AppSize.hairline)
                    }
                    HStack(alignment: .firstTextBaseline, spacing: AppSpacing.md) {
                        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                            Text(item.name)
                                .font(AppTypography.subtitle)
                                .foregroundStyle(AppColors.onSurface)
                            Text(item.description)
                                .font(AppTypography.caption)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                        }
                        Spacer(minLength: AppSpacing.md)
                        Text(Formatters.price(item.price))
                            .font(AppTypography.label)
                            .foregroundStyle(AppColors.primary)
                    }
                    .padding(.vertical, AppSpacing.md)
                }
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.vertical, AppSpacing.xs)
            .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg, style: .continuous))
        }
    }

    private func hours(_ restaurant: Restaurant) -> some View {
        section(Strings.restaurantHours) {
            VStack(spacing: AppSpacing.sm) {
                ForEach(viewModel.hours(restaurant)) { row in
                    HStack {
                        Text(row.weekday.label)
                        Spacer()
                        Text(row.text)
                            .foregroundStyle(row.isToday ? AppColors.primary : (row.isClosed ? AppColors.onSurfaceVariant : AppColors.onSurface))
                    }
                    .font(row.isToday ? AppTypography.label : AppTypography.body)
                    .foregroundStyle(row.isToday ? AppColors.primary : AppColors.onSurface)
                    .accessibilityElement(children: .combine)
                    .accessibilityAddTraits(row.isToday ? .isSelected : [])
                    .accessibilityIdentifier("restaurant.hours.\(row.weekday.key)")
                }
            }
            .padding(AppSpacing.lg)
            .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg, style: .continuous))
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("restaurant.hours")
        }
    }

    private func location(_ restaurant: Restaurant) -> some View {
        section(Strings.restaurantLocation) {
            MapCard(restaurant: restaurant)
                .accessibilityIdentifier("restaurant.map")
            Text(restaurant.address)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: AppSpacing.md) {
                SecondaryButton(title: Strings.restaurantDirections, icon: AppIcon.directions) {
                    if let url = RestaurantViewModel.directionsURL(restaurant) { openURL(url) }
                }
                .accessibilityIdentifier("restaurant.directions")
                SecondaryButton(title: Strings.restaurantCall, icon: AppIcon.phone) {
                    if let url = RestaurantViewModel.callURL(restaurant) { openURL(url) }
                }
                .accessibilityIdentifier("restaurant.call")
            }
        }
    }

    private func amenities(_ restaurant: Restaurant) -> some View {
        section(Strings.restaurantAmenities) {
            LazyVGrid(columns: [GridItem(.flexible(), alignment: .leading), GridItem(.flexible(), alignment: .leading)], alignment: .leading, spacing: AppSpacing.md) {
                ForEach(restaurant.amenities) { amenity in
                    HStack(spacing: AppSpacing.sm) {
                        icon(amenity.icon, size: AppIconSize.md, color: AppColors.accent)
                        Text(amenity.label)
                            .font(AppTypography.label)
                            .foregroundStyle(AppColors.onSurface)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
        }
    }

    private func reviews(_ restaurant: Restaurant) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            HStack(alignment: .lastTextBaseline, spacing: AppSpacing.md) {
                Text(Strings.restaurantReviews)
                    .font(AppSerif.title)
                    .foregroundStyle(AppColors.onBackground)
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: 0)
                Text(Formatters.rating(restaurant.rating))
                    .font(AppSerif.display)
                    .foregroundStyle(AppColors.primary)
                    .accessibilityLabel(Strings.restaurantRatingLabel(rating: Formatters.rating(restaurant.rating)))
                Text(Formatters.reviewCount(restaurant.reviewCount))
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
            .padding(.horizontal, AppSpacing.lg)
            ScrollView(.horizontal) {
                HStack(alignment: .top, spacing: AppSpacing.md) {
                    ForEach(restaurant.reviews, id: \.author) { review in
                        ReviewCard(review: review)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .contentMargins(.horizontal, AppSpacing.lg, for: .scrollContent)
            .scrollIndicators(.hidden)
        }
    }

    private func reserveBar(_ restaurant: Restaurant) -> some View {
        StickyActionBar {
            VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                Text(Strings.restaurantCostForTwo(price: Formatters.price(restaurant.costForTwo)))
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onSurface)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                if let availability = viewModel.availability {
                    Text(availability.label)
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
            }
        } action: {
            PrimaryButton(title: Strings.restaurantReserve) {
                router.push(.reserve(restaurantId: restaurant.id))
            }
            .accessibilityIdentifier("restaurant.reserve")
        }
    }

    private func icon(_ resource: ImageResource, size: CGFloat, color: Color) -> some View {
        Image(resource)
            .renderingMode(.template).resizable().scaledToFit()
            .frame(width: size, height: size)
            .foregroundStyle(color)
    }
}

/// The paged photo gallery, stretching when pulled down.
private struct RestaurantGallery: View {
    let restaurant: Restaurant
    let scroll: ScrollOffset
    @State private var page = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let pulled = reduceMotion ? 0 : max(0, scroll.value)
        ZStack(alignment: .bottom) {
            TabView(selection: $page) {
                ForEach(Array(restaurant.gallery.enumerated()), id: \.offset) { index, url in
                    RemoteImage(url: url, label: restaurant.name)
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .accessibilityIdentifier("restaurant.gallery")
            PhotoScrim().frame(height: AppSize.detailHeroHeight / 2)
            HStack(spacing: AppSpacing.xs) {
                ForEach(restaurant.gallery.indices, id: \.self) { index in
                    Capsule()
                        .fill(AppColors.onGlassOnImage.opacity(index == page ? 1 : 0.5))
                        .frame(width: index == page ? AppSpacing.lg : AppSpacing.sm, height: AppSpacing.sm)
                }
            }
            .animation(AppMotion.reduced(AppMotion.snappy, reduceMotion), value: page)
            .padding(.bottom, AppSpacing.xl + AppSpacing.lg)
            .accessibilityHidden(true)
        }
        .overlay(alignment: .bottomTrailing) {
            Text(Strings.restaurantGalleryPosition(index: page + 1, total: restaurant.gallery.count))
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onGlassOnImage)
                .padding(.horizontal, AppSpacing.md)
                .padding(.vertical, AppSpacing.xs)
                .background(AppColors.glassOnImage, in: .capsule)
                .background(.ultraThinMaterial, in: .capsule)
                .padding(.trailing, AppSpacing.lg)
                .padding(.bottom, AppSpacing.xl + AppSpacing.md)
                .contentTransition(.numericText())
        }
        .frame(height: AppSize.detailHeroHeight)
        .scaleEffect(1 + pulled / AppSize.detailHeroHeight, anchor: .bottom)
        .clipped()
    }
}

/// One guest review in the carousel.
private struct ReviewCard: View {
    static let maxStars = 5
    let review: Review

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Image(AppIcon.quote)
                .renderingMode(.template).resizable().scaledToFit()
                .frame(width: AppIconSize.lg, height: AppIconSize.lg)
                .foregroundStyle(AppColors.accent)
            Text(review.text)
                .font(AppSerif.italic(.title))
                .foregroundStyle(AppColors.onSurface)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            HStack {
                VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                    Text(review.author)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.onSurface)
                    Text(Formatters.dateShort(iso: review.date))
                        .font(AppTypography.caption)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                }
                Spacer()
                HStack(spacing: AppSpacing.xxs) {
                    ForEach(0..<Self.maxStars, id: \.self) { index in
                        Image(index < review.rating ? AppIcon.starFilled : AppIcon.star)
                            .renderingMode(.template).resizable().scaledToFit()
                            .frame(width: AppIconSize.xs, height: AppIconSize.xs)
                            .foregroundStyle(AppColors.accent)
                    }
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(Strings.restaurantRatingLabel(rating: String(review.rating)))
            }
        }
        .padding(AppSpacing.lg)
        .frame(width: AppSize.featuredCardWidth, alignment: .leading)
        .frame(minHeight: AppSize.collectionCardWidth)
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg, style: .continuous))
    }
}

/// The OpenStreetMap tile containing the restaurant, cropped so the pin is as close to the
/// vertical centre as the tile allows.
struct MapCard: View {
    let restaurant: Restaurant

    var body: some View {
        let tile = MapTile(latitude: restaurant.latitude, longitude: restaurant.longitude)
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            let pinY = tile.fractionY * width
            let offsetY = min(0, max(height - width, height / 2 - pinY))
            ZStack(alignment: .topLeading) {
                RemoteImage(url: tile.url)
                    .frame(width: width, height: width)
                    .offset(y: offsetY)
                Image(AppIcon.location)
                    .renderingMode(.template).resizable().scaledToFit()
                    .frame(width: AppIconSize.lg, height: AppIconSize.lg)
                    .foregroundStyle(AppColors.espresso)
                    .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                    .background(AppColors.accent, in: .circle)
                    .shadow(AppElevation.low)
                    .position(x: tile.fractionX * width, y: pinY + offsetY)
            }
            .frame(width: width, height: height, alignment: .topLeading)
        }
        .frame(height: AppSize.listImageHeight)
        .overlay(alignment: .bottomTrailing) {
            Text(Strings.restaurantMapAttribution)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurface)
                .padding(.horizontal, AppSpacing.sm)
                .padding(.vertical, AppSpacing.xxs)
                .background(AppColors.glassStrong, in: .capsule)
                .padding(AppSpacing.sm)
        }
        .clipShape(.rect(cornerRadius: AppRadius.lg, style: .continuous))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(restaurant.address)
    }
}

#Preview {
    let session = MemberSession.preview()
    NavigationStack {
        RestaurantScreen(viewModel: RestaurantViewModel(session: session, restaurantId: "maison-lumiere"))
    }
    .environment(session)
    .environment(session.router)
}
