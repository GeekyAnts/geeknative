import SwiftUI

struct HomeScreen: View {
    @Environment(AppContainer.self) private var container
    @Environment(AppNavigation.self) private var navigation
    @State private var viewModel = HomeViewModel(repository: InMemoryWeddingRepository())
    @State private var didLoad = false

    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    hero(topInset: proxy.safeAreaInsets.top)
                    featured
                    experiences
                    packages
                }
            }
            .ignoresSafeArea(edges: .top)
            .background(AppColors.background)
            .toolbar(.hidden, for: .navigationBar)
        }
        .onAppear {
            guard !didLoad else { return }
            didLoad = true
            viewModel = HomeViewModel(repository: container.weddingRepository)
        }
    }

    private func hero(topInset: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            homeChrome(topInset: topInset)
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                Text(Strings.homeHeroTitle)
                    .font(AppTypography.hero)
                    .foregroundStyle(AppColors.inverse)
                    .shadow(color: AppColors.onInverse.opacity(0.45), radius: 12, y: 1)
                Text(Strings.homeHeroBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.inverse)
                    .shadow(color: AppColors.onInverse.opacity(0.4), radius: 10, y: 1)
                HStack(spacing: AppSpacing.md) {
                    Button(Strings.homeExploreCta) {
                        navigation.open(.destinations)
                    }
                    .buttonStyle(.primary)
                    .accessibilityIdentifier("home.exploreCta")
                    Button(Strings.homePlanCta) {
                        navigation.open(.wedding)
                    }
                    .buttonStyle(.secondaryOnImage)
                    .accessibilityIdentifier("home.planCta")
                }
                searchPanel
            }
            .padding(.horizontal, AppSpacing.lg)
            .padding(.bottom, AppSpacing.xl)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            ZStack {
                CatalogPhoto(urlString: WeddingCatalog.heroImageUrl, cinematic: true)
                    .accessibilityLabel(Strings.homeHeroImageAlt)
                LinearGradient(
                    colors: [
                        AppColors.onInverse.opacity(0.55),
                        AppColors.onInverse.opacity(0.42),
                        AppColors.onInverse.opacity(0.82),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .allowsHitTesting(false)
                .accessibilityHidden(true)
            }
        }
    }

    private func homeChrome(topInset: CGFloat) -> some View {
        HStack {
            Text(AppIdentity.name)
                .font(AppTypography.title)
                .tracking(2)
                .foregroundStyle(AppColors.inverse)
                .shadow(color: AppColors.onInverse.opacity(0.45), radius: 8, y: 1)
            Spacer()
            Button {
                navigation.push(.settings)
            } label: {
                Image(AppIcon.settings)
                    .foregroundStyle(AppColors.inverse)
                    .frame(width: AppSize.touchTarget, height: AppSize.touchTarget)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(Strings.homeOpenSettings)
            .accessibilityIdentifier("home.openSettings")
        }
        .padding(.top, max(topInset, 54 as CGFloat))
        .padding(.horizontal, AppSpacing.lg)
    }

    private var searchPanel: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                searchField(title: Strings.homeSearchLocation, icon: AppIcon.mapPin) {
                    AppTextField(prompt: Strings.homeSearchLocationPlaceholder, text: $viewModel.location)
                }
                searchField(title: Strings.homeSearchDate, icon: AppIcon.calendar) {
                    AppDateField(
                        title: Strings.homeSearchDate,
                        date: $viewModel.date,
                        hasDate: $viewModel.hasDate
                    )
                }
                searchField(title: Strings.homeSearchGuests, icon: AppIcon.users) {
                    AppTextField(prompt: Strings.homeSearchGuests, text: $viewModel.guests, keyboard: .numberPad)
                }
                searchField(title: Strings.homeSearchBudget, icon: AppIcon.wallet) {
                    AppTextField(prompt: Strings.homeSearchBudget, text: $viewModel.budget, keyboard: .numberPad)
                }
                Button(Strings.homeSearchSubmit) {
                    viewModel.submitSearch()
                    navigation.open(.destinations)
                }
                .buttonStyle(.primary)
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("home.search.submit")
            }
        }
        .testIdentifier(testId: "home.search")
        .shadow(AppElevation.high)
    }

    private func searchField<Content: View>(
        title: String,
        icon: ImageResource,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text(title)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
            HStack(spacing: AppSpacing.sm) {
                Image(icon)
                    .foregroundStyle(AppColors.primary)
                    .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                content()
            }
            .padding(.horizontal, AppSpacing.md)
            .frame(minHeight: AppSize.touchTarget)
            .background(AppColors.background, in: .rect(cornerRadius: AppRadius.sm))
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.sm)
                    .stroke(AppColors.outline)
            }
        }
    }

    private var featured: some View {
        VStack(alignment: .leading, spacing: AppSpacing.xl) {
            Text(Strings.homeFeaturedTitle)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.tertiary)
            Text(Strings.homeFeaturedBody)
                .font(AppTypography.display)
                .foregroundStyle(AppColors.onBackground)
            ForEach(viewModel.featured) { destination in
                NavigationLink(value: Route.destination(destination.id)) {
                    featuredCard(destination)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("home.destination.\(destination.id)")
            }
        }
        .padding(AppSpacing.xl)
        .testIdentifier(testId: "home.featured")
    }

    private func featuredCard(_ destination: Destination) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            CatalogPhoto(urlString: destination.imageUrl)
                .frame(height: 220)
                .frame(maxWidth: .infinity)
                .overlay(alignment: .bottomLeading) {
                    Text(destination.name)
                        .font(AppTypography.headline)
                        .foregroundStyle(AppColors.inverse)
                        .padding(AppSpacing.md)
                }
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Text(destination.region)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.tertiary)
                Text(destination.tagline)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.primary)
                Text(destination.description)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                HStack(spacing: AppSpacing.sm) {
                    Text(Strings.homeExploreDestination)
                        .font(AppTypography.label)
                        .foregroundStyle(AppColors.primary)
                    Image(AppIcon.chevronRight)
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        .foregroundStyle(AppColors.primary)
                }
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.xl))
        .shadow(AppElevation.high)
    }

    private var experiences: some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            Text(Strings.homeExperiencesTitle)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.tertiary)
            Text(Strings.homeExperiencesBody)
                .font(AppTypography.display)
                .foregroundStyle(AppColors.onBackground)
            ForEach(viewModel.teaserExperiences) { experience in
                Button {
                    navigation.open(.experiences)
                } label: {
                    HStack(spacing: AppSpacing.md) {
                        CatalogPhoto(urlString: experience.imageUrl)
                            .frame(width: 96, height: 96)
                            .clipShape(.rect(cornerRadius: AppRadius.md))
                        VStack(alignment: .leading, spacing: AppSpacing.xs) {
                            Text(experience.name)
                                .font(AppTypography.title)
                                .foregroundStyle(AppColors.onSurface)
                            Text(experience.description)
                                .font(AppTypography.body)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                                .lineLimit(3)
                        }
                    }
                    .padding(AppSpacing.md)
                    .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.lg))
                    .shadow(AppElevation.low)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(AppSpacing.xl)
        .background(AppColors.surfaceVariant.opacity(0.6))
    }

    private var packages: some View {
        VStack(alignment: .leading, spacing: AppSpacing.lg) {
            Text(Strings.homePackagesTitle)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.tertiary)
            Text(Strings.homePackagesBody)
                .font(AppTypography.display)
                .foregroundStyle(AppColors.onBackground)
            ForEach(viewModel.packages) { item in
                Button {
                    navigation.push(.packages)
                } label: {
                    ZStack(alignment: .bottom) {
                        CatalogPhoto(urlString: item.imageUrl)
                            .frame(height: 220)
                            .frame(maxWidth: .infinity)
                        GlassPanel {
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text(item.name)
                                    .font(AppTypography.title)
                                    .foregroundStyle(AppColors.onSurface)
                                Text(CatalogFormat.amount(item.basePrice))
                                    .font(AppTypography.body)
                                    .foregroundStyle(AppColors.onSurfaceVariant)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(AppSpacing.md)
                    }
                    .clipShape(.rect(cornerRadius: AppRadius.xl))
                    .shadow(AppElevation.high)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(AppSpacing.xl)
    }
}

#Preview {
    NavigationStack {
        HomeScreen()
    }
    .environment(AppContainer.preview())
    .environment(AppNavigation())
}
