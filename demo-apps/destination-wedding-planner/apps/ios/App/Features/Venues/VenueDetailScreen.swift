import SwiftUI
import UIKit

struct VenueDetailScreen: View {
    let venueId: String
    @Environment(AppContainer.self) private var container
    @State private var showingEnquiry = false

    private var venue: Venue? { WeddingCatalog.venue(id: venueId) }
    private var plan: WeddingPlan { container.weddingRepository.plan }

    var body: some View {
        ScrollView {
            if let venue {
                content(venue)
            }
        }
        .background(AppColors.background)
        .navigationTitle(venue?.name ?? "")
        .sheet(isPresented: $showingEnquiry) {
            if let venue {
                EnquireSheet(
                    title: Strings.venuesEnquireTitle,
                    successMessage: Strings.venuesEnquireSuccess,
                    formTestID: "venues.enquireForm",
                    submitTestID: "venues.enquireSubmit",
                    successTestID: "venues.enquireSuccess",
                    onSubmit: { send(draft: $0, venue: venue) }
                )
            }
        }
    }

    private func content(_ venue: Venue) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            hero(venue)
            VStack(alignment: .leading, spacing: AppSpacing.lg) {
                booking(venue)
                Text(venue.description)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onBackground)
                gallery(venue)
                labeledList(Strings.venuesHighlights, venue.highlights)
                section(Strings.venuesSpaces, venue.spaces.joined(separator: " · "))
                section(Strings.venuesAccommodation, venue.accommodation)
                section(Strings.venuesAmenities, venue.amenities.joined(separator: " · "))
                section(
                    Strings.venuesPackages,
                    WeddingCatalog.packages.filter { venue.packageIds.contains($0.id) }.map(\.name).joined(separator: " · ")
                )
                reviews(venue)
                map(venue)
            }
            .padding(AppSpacing.lg)
        }
    }

    private func hero(_ venue: Venue) -> some View {
        ZStack(alignment: .bottomLeading) {
            CatalogPhoto(urlString: venue.imageUrl, cinematic: true)
                .frame(height: 320)
                .frame(maxWidth: .infinity)
            LinearGradient(
                colors: [.clear, AppColors.onBackground.opacity(0.8)],
                startPoint: .top,
                endPoint: .bottom
            )
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(WeddingCatalog.destination(id: venue.destinationId)?.name ?? "")
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.tertiary)
                Text(venue.name)
                    .font(AppTypography.display)
                    .foregroundStyle(AppColors.inverse)
            }
            .padding(AppSpacing.lg)
        }
    }

    private func booking(_ venue: Venue) -> some View {
        let saved = plan.savedVenueIds.contains(venue.id)
        return GlassPanel {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                Text(Strings.venuesCapacity(count: venue.capacity))
                    .font(AppTypography.label)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Text(Strings.venuesPriceFrom(amount: CatalogFormat.amount(venue.priceFrom)))
                    .font(AppTypography.headline)
                    .foregroundStyle(AppColors.onSurface)
                Text(Strings.venuesRating(rating: String(venue.rating), count: venue.reviewCount))
                    .font(AppTypography.caption)
                    .foregroundStyle(AppColors.onSurfaceVariant)
                Button(Strings.venuesEnquireCta) {
                    showingEnquiry = true
                }
                .buttonStyle(.primary)
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("venues.enquireCta")
                Button {
                    container.weddingRepository.update(
                        WeddingPlanPatch(
                            destinationId: venue.destinationId,
                            venueId: venue.id,
                            savedVenueIds: withToggledId(plan.savedVenueIds, venue.id)
                        )
                    )
                } label: {
                    HStack(spacing: AppSpacing.sm) {
                        Image(AppIcon.heart)
                            .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                        Text(saved ? Strings.commonSaved : Strings.venuesSave)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.secondary)
                .accessibilityLabel(saved ? Strings.venuesUnsave : Strings.venuesSave)
                .accessibilityIdentifier("venues.save")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .shadow(AppElevation.low)
    }

    private func gallery(_ venue: Venue) -> some View {
        VStack(spacing: AppSpacing.sm) {
            ForEach(venue.gallery, id: \.self) { url in
                CatalogPhoto(urlString: url)
                    .frame(height: 160)
                    .frame(maxWidth: .infinity)
                    .clipShape(.rect(cornerRadius: AppRadius.lg))
            }
        }
    }

    private func labeledList(_ title: String, _ items: [String]) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text(title)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            ForEach(items, id: \.self) { item in
                Text(item)
                    .font(AppTypography.body)
                    .foregroundStyle(AppColors.onSurface)
            }
        }
    }

    private func section(_ title: String, _ body: String) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            Text(title)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            Text(body)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurfaceVariant)
        }
    }

    private func reviews(_ venue: Venue) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.venuesReviews)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            ForEach(venue.reviews, id: \.author) { review in
                AppCard {
                    Text(review.author)
                        .font(AppTypography.title)
                        .foregroundStyle(AppColors.onSurface)
                    Text(review.body)
                        .font(AppTypography.body)
                        .foregroundStyle(AppColors.onSurfaceVariant)
                }
                .shadow(AppElevation.low)
            }
        }
    }

    private func map(_ venue: Venue) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text(Strings.venuesLocation)
                .font(AppTypography.headline)
                .foregroundStyle(AppColors.onBackground)
            Text(venue.location)
                .font(AppTypography.body)
                .foregroundStyle(AppColors.onSurface)
            Button {
                openMap(latitude: venue.latitude, longitude: venue.longitude)
            } label: {
                HStack(spacing: AppSpacing.sm) {
                    Image(AppIcon.map)
                        .frame(width: AppIconSize.sm, height: AppIconSize.sm)
                    Text(Strings.venuesOpenMap)
                }
            }
            .buttonStyle(.secondary)
            .accessibilityIdentifier("venues.map")
        }
    }

    private func send(draft: EnquiryDraft, venue: Venue) {
        container.weddingRepository.addEnquiry(
            Enquiry(
                id: UUID().uuidString,
                venueId: venue.id,
                experienceId: "",
                coupleName: draft.coupleName,
                email: draft.email,
                date: draft.isoDate,
                guests: CatalogFormat.parsePositiveInt(draft.guests),
                message: draft.message,
                createdAt: ISO8601DateFormatter().string(from: Date())
            )
        )
        container.weddingRepository.update(
            WeddingPlanPatch(
                date: draft.isoDate.isEmpty ? nil : draft.isoDate,
                destinationId: venue.destinationId,
                venueId: venue.id,
                guestCount: CatalogFormat.parsePositiveInt(draft.guests) > 0
                    ? CatalogFormat.parsePositiveInt(draft.guests)
                    : nil,
                bookingStatus: .enquirySent
            )
        )
    }

    private func openMap(latitude: Double, longitude: Double) {
        let query = "ll=\(latitude),\(longitude)"
        if let maps = URL(string: "maps://?\(query)"), UIApplication.shared.canOpenURL(maps) {
            UIApplication.shared.open(maps)
        } else if let apple = URL(string: "http://maps.apple.com/?\(query)") {
            UIApplication.shared.open(apple)
        }
    }
}

#Preview {
    NavigationStack {
        VenueDetailScreen(venueId: "udaipur-taj-lake")
    }
    .environment(AppContainer.preview())
}
