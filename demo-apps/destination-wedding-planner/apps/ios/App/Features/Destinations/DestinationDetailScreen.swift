import SwiftUI

struct DestinationDetailScreen: View {
    let destinationId: String
    @Environment(AppContainer.self) private var container

    private var destination: Destination? {
        WeddingCatalog.destination(id: destinationId)
    }

    private var plan: WeddingPlan { container.weddingRepository.plan }

    var body: some View {
        ScrollView {
            if let destination {
                content(destination)
            }
        }
        .background(AppColors.background)
        .navigationTitle(destination?.name ?? "")
    }

    private func content(_ destination: Destination) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            hero(destination)
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                saveButton(destination)
                Text(destination.description)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onBackground)
                Text(destination.seasonalNote)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Text(meta(destination))
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                gallery(destination.gallery, name: destination.name)
                venues(destination)
                packages(destination)
            }
            .padding(AppSpacing.lg)
        }
    }

    private func hero(_ destination: Destination) -> some View {
        ZStack(alignment: .bottomLeading) {
            CatalogPhoto(urlString: destination.imageUrl, cinematic: true)
                .frame(height: 320)
                .frame(maxWidth: .infinity)
            LinearGradient(
                colors: [.clear, AppColors.onBackground.opacity(0.8)],
                startPoint: .top,
                endPoint: .bottom
            )
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(destination.region)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.tertiary)
                Text(destination.name)
                    .font(AppTypography.display)
                    .foregroundStyle(AppColors.inverse)
                Text(destination.tagline)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.inverse.opacity(0.9))
            }
            .padding(AppSpacing.lg)
        }
    }

    private func saveButton(_ destination: Destination) -> some View {
        let saved = plan.savedDestinationIds.contains(destination.id)
        return Button {
            container.weddingRepository.update(
                WeddingPlanPatch(
                    destinationId: destination.id,
                    savedDestinationIds: withToggledId(plan.savedDestinationIds, destination.id)
                )
            )
        } label: {
            HStack(spacing: AppSpacing.sm) {
                Image(AppIcon.heart)
                    .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                Text(saved ? Strings.commonSaved : Strings.destinationsSave)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.primary)
        .accessibilityLabel(saved ? Strings.destinationsUnsave : Strings.destinationsSave)
        .accessibilityIdentifier("destinations.save")
    }

    private func gallery(_ urls: [String], name: String) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            ForEach(urls, id: \.self) { url in
                CatalogPhoto(urlString: url)
                    .frame(height: 160)
                    .frame(maxWidth: .infinity)
                    .clipShape(.rect(cornerRadius: AppRadius.lg))
                    .overlay(alignment: .bottomLeading) {
                        Text(name)
                            .font(AppTypography.caption)
                            .foregroundStyle(AppColors.inverse)
                            .padding(AppSpacing.sm)
                    }
            }
        }
    }

    private func venues(_ destination: Destination) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.destinationsVenuesTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            ForEach(WeddingCatalog.venues(forDestinationId: destination.id)) { venue in
                NavigationLink(value: Route.venue(venue.id)) {
                    HStack(spacing: AppSpacing.md) {
                        CatalogPhoto(urlString: venue.imageUrl)
                            .frame(width: 96, height: 80)
                            .clipShape(.rect(cornerRadius: AppRadius.md))
                        VStack(alignment: .leading, spacing: AppSpacing.xs) {
                            Text(venue.name)
                                .font(AppTypography.title)
                                .foregroundStyle(AppColors.onSurface)
                            Text(Strings.venuesPriceFrom(amount: CatalogFormat.amount(venue.priceFrom)))
                                .font(AppTypography.label)
                                .foregroundStyle(AppColors.onSurfaceVariant)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
            NavigationLink(value: Route.venues) {
                Text(Strings.navVenues)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.secondary)
        }
        .testIdentifier(testId: "destinations.venues")
    }

    private func packages(_ destination: Destination) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text(Strings.destinationsPackagesTitle)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            ForEach(WeddingCatalog.packages.filter { destination.packageIds.contains($0.id) }) { item in
                Text(item.name)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurface)
            }
        }
    }

    private func meta(_ destination: Destination) -> String {
        let styles = destination.styles.map(\.label).joined(separator: " · ")
        let capacity = Strings.destinationsCapacity(count: destination.guestCapacityMax)
        let budget = Strings.destinationsBudgetFrom(amount: CatalogFormat.amount(destination.budgetMin))
        return "\(styles) · \(capacity) · \(budget)"
    }
}

#Preview {
    NavigationStack {
        DestinationDetailScreen(destinationId: "udaipur")
    }
    .environment(AppContainer.preview())
}
