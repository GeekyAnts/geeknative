import SwiftUI

/// The storefront (spec/features/home.md).
struct HomeScreen: View {
    @State private var viewModel: HomeViewModel

    init(viewModel: HomeViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    private let categoryColumns = Array(
        repeating: GridItem(.flexible(), spacing: AppSpacing.md, alignment: .top),
        count: 3
    )

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                VStack(alignment: .leading, spacing: AppSpacing.lg) {
                    deliveryPromise
                    searchEntry
                }
                .padding(.horizontal, AppSpacing.lg)

                banner
                    .padding(.horizontal, AppSpacing.lg)

                categoriesSection
                    .padding(.horizontal, AppSpacing.lg)

                bestsellersSection
            }
            .padding(.top, AppSpacing.sm)
            .padding(.bottom, AppSpacing.xl)
        }
        .background(AppColors.background)
        .navigationTitle(viewModel.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                cartButton
                Button(action: viewModel.openSettings) {
                    Image(AppIcon.settings)
                }
                .accessibilityLabel(Strings.homeOpenSettings)
                .accessibilityIdentifier("home.openSettings")
            }
        }
        .cartBar(onOpen: viewModel.openCart)
    }

    // MARK: - Header

    private var cartButton: some View {
        Button(action: viewModel.openCart) {
            Image(AppIcon.cart)
                .overlay(alignment: .topTrailing) {
                    if let count = viewModel.cartBadge {
                        Text(count, format: .number)
                            .font(AppTypography.caption)
                            .fontWeight(.bold)
                            .monospacedDigit()
                            .foregroundStyle(AppColors.onPrimary)
                            .padding(.horizontal, 5)
                            .frame(minWidth: 18, minHeight: 18)
                            .background(AppColors.primary, in: .capsule)
                            .offset(x: 10, y: -8)
                            .accessibilityIdentifier("home.cartBadge")
                            .transition(.scale.combined(with: .opacity))
                    }
                }
        }
        .accessibilityLabel(Strings.homeOpenCart)
        .accessibilityValue(viewModel.cartBadge.map { Strings.commonItemCount(count: $0) } ?? "")
        .accessibilityIdentifier("home.openCart")
    }

    // MARK: - Delivery promise

    private var deliveryPromise: some View {
        HStack(alignment: .center, spacing: AppSpacing.md) {
            IconCircle(icon: AppIcon.fast, fill: AppColors.accent, foreground: AppColors.onAccent, diameter: 48, iconSize: AppIconSize.md)
            VStack(alignment: .leading, spacing: 2) {
                Text(viewModel.deliveryPromise)
                    .font(AppTypography.headline)
                    .foregroundStyle(AppColors.onBackground)
                    .minimumScaleFactor(0.8)
                    .lineLimit(2)
                HStack(spacing: AppSpacing.xs) {
                    Image(AppIcon.location)
                        .resizable()
                        .scaledToFit()
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        .accessibilityHidden(true)
                    Text(viewModel.deliveryAddress)
                        .font(AppTypography.label)
                }
                .foregroundStyle(AppColors.onSurfaceVariant)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("home.delivery")
    }

    // MARK: - Search entry

    private var searchEntry: some View {
        Button(action: viewModel.openSearch) {
            HStack(spacing: AppSpacing.sm) {
                Image(AppIcon.search)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 20, height: 20)
                    .accessibilityHidden(true)
                Text(Strings.searchPlaceholder)
                    .font(AppTypography.body)
                    .lineLimit(1)
            }
            .foregroundStyle(AppColors.onSurfaceVariant)
            .fieldCapsule()
            .contentShape(.capsule)
        }
        .buttonStyle(.pressable)
        .accessibilityIdentifier("home.search")
    }

    // MARK: - Banner

    private var banner: some View {
        HStack(alignment: .center, spacing: AppSpacing.sm) {
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                HStack(spacing: AppSpacing.xs) {
                    Image(AppIcon.fast)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 12, height: 12)
                        .accessibilityHidden(true)
                    Text(Strings.homeBannerEyebrow)
                        .font(AppTypography.caption)
                        .fontWeight(.bold)
                        .textCase(.uppercase)
                }
                .foregroundStyle(AppColors.onAccent)
                .padding(.horizontal, AppSpacing.sm)
                .padding(.vertical, AppSpacing.xs)
                .background(AppColors.accent, in: .capsule)

                Text(Strings.homeBannerTitle)
                    .font(AppTypography.headline)
                    .foregroundStyle(AppColors.onBanner)
                    .fixedSize(horizontal: false, vertical: true)

                Text(viewModel.bannerBody)
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onBanner.opacity(0.8))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text(verbatim: "🛒")
                .font(.system(size: 72))
                .rotationEffect(.degrees(-8))
                .accessibilityHidden(true)
        }
        .padding(AppSpacing.xl)
        .background(alignment: .bottomTrailing) {
            // Soft glows give the banner depth without extra colors.
            ZStack {
                AppColors.banner
                Circle()
                    .fill(AppColors.primary.opacity(0.35))
                    .frame(width: 180, height: 180)
                    .blur(radius: 40)
                    .offset(x: 50, y: 40)
                Circle()
                    .fill(AppColors.accent.opacity(0.18))
                    .frame(width: 120, height: 120)
                    .blur(radius: 40)
                    .offset(x: -120, y: -60)
            }
        }
        .clipShape(.rect(cornerRadius: AppRadius.xl, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("home.banner")
    }

    // MARK: - Categories

    private var categoriesSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.homeCategoriesTitle)
            LazyVGrid(columns: categoryColumns, spacing: AppSpacing.lg) {
                ForEach(viewModel.categories) { category in
                    CategoryTile(category: category) { viewModel.openCategory(category.id) }
                }
            }
        }
    }

    // MARK: - Bestsellers

    private var bestsellersSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            SectionHeader(title: Strings.homeBestsellersTitle)
                .padding(.horizontal, AppSpacing.lg)
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(alignment: .top, spacing: AppSpacing.md) {
                    ForEach(viewModel.bestsellers) { product in
                        ProductCard(product: product, cart: viewModel.cart)
                            .frame(width: 164)
                    }
                }
                .padding(.horizontal, AppSpacing.lg)
            }
            .scrollClipDisabled()
        }
    }
}

#Preview {
    let container = AppContainer.preview(cart: [CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)])
    NavigationStack {
        HomeScreen(viewModel: HomeViewModel(container: container))
    }
    .environment(container)
}
