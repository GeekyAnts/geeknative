import SwiftUI
import UIKit

struct VenuesScreen: View {
    @State private var viewModel = VenuesViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                Text(Strings.venuesBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                filters
                results
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.background)
        .navigationTitle(Strings.venuesTitle)
    }

    private var filters: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(Strings.venuesFilterDestination)
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Picker(Strings.venuesFilterDestination, selection: $viewModel.destinationId) {
                    Text(Strings.venuesFilterAllDestinations).tag("")
                    ForEach(WeddingCatalog.destinations) { destination in
                        Text(destination.name).tag(destination.id)
                    }
                }
                .pickerStyle(.menu)
                .frame(minHeight: AppSize.touchTarget)
                .accessibilityIdentifier("venues.filter.destination")
            }
            field(Strings.destinationsFilterGuests, text: $viewModel.guests, keyboard: .numberPad)
            field(Strings.destinationsFilterBudget, text: $viewModel.budget, keyboard: .numberPad)
        }
    }

    @ViewBuilder
    private var results: some View {
        if viewModel.results.isEmpty {
            AppCard {
                Text(Strings.venuesEmptyTitle)
                    .font(AppTypography.title)
                    .foregroundStyle(AppColors.onSurface)
                Text(Strings.venuesEmptyBody)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
            }
        } else {
            VStack(alignment: .leading, spacing: AppSpacing.xl) {
                ForEach(viewModel.results) { venue in
                    NavigationLink(value: Route.venue(venue.id)) {
                        venueCard(venue)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("venues.card.\(venue.id)")
                }
            }
            .testIdentifier(testId: "venues.list")
        }
    }

    private func venueCard(_ venue: Venue) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            CatalogPhoto(urlString: venue.imageUrl)
                .frame(height: 200)
                .frame(maxWidth: .infinity)
                .overlay(alignment: .bottomLeading) {
                    Text(venue.name)
                        .font(AppTypography.headline)
                        .foregroundStyle(AppColors.inverse)
                        .padding(AppSpacing.md)
                }
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                Text(venue.location)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Text(
                    Strings.venuesCapacity(count: venue.capacity)
                        + " · "
                        + Strings.venuesPriceFrom(amount: CatalogFormat.amount(venue.priceFrom))
                )
                .font(AppTypography.label)
                .foregroundStyle(AppColors.onSurface)
            }
            .padding(AppSpacing.lg)
        }
        .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.xl))
        .shadow(AppElevation.high)
    }

    private func field(_ title: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text(title)
                .font(AppTypography.caption)
                .foregroundStyle(AppColors.onSurfaceVariant)
            AppTextField(prompt: title, text: text, keyboard: keyboard)
                .padding(.horizontal, AppSpacing.md)
                .frame(minHeight: AppSize.touchTarget)
                .background(AppColors.surface, in: .rect(cornerRadius: AppRadius.sm))
                .overlay {
                    RoundedRectangle(cornerRadius: AppRadius.sm)
                        .stroke(AppColors.outline)
                }
        }
    }
}

#Preview {
    NavigationStack {
        VenuesScreen()
    }
    .environment(AppContainer.preview())
    .environment(AppNavigation())
}
