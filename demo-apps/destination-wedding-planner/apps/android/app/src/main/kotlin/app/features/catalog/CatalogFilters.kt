package app.features.catalog

import java.text.DateFormatSymbols
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Locale

data class DestinationFilters(
    val location: String = "",
    val style: String = "",
    val guests: Int = 0,
    val budget: Int = 0,
)

fun filterDestinations(
    filters: DestinationFilters,
    catalog: List<Destination> = WeddingCatalog.destinations,
): List<Destination> {
    val needle = filters.location.trim()
    return catalog.filter { destination ->
        if (needle.isNotEmpty()) {
            val haystack = "${destination.name} ${destination.country} ${destination.region}"
            if (!haystack.contains(needle, ignoreCase = true)) return@filter false
        }
        if (filters.style.isNotEmpty() && filters.style !in destination.styles) return@filter false
        if (filters.guests > 0 && destination.guestCapacityMax < filters.guests) return@filter false
        if (filters.budget > 0 && destination.budgetMin > filters.budget) return@filter false
        true
    }
}

data class VenueFilters(
    val destinationId: String = "",
    val guests: Int = 0,
    val budget: Int = 0,
)

fun filterVenues(
    filters: VenueFilters,
    catalog: List<Venue> = WeddingCatalog.venues,
): List<Venue> = catalog.filter { venue ->
    if (filters.destinationId.isNotEmpty() && venue.destinationId != filters.destinationId) return@filter false
    if (filters.guests > 0 && venue.capacity < filters.guests) return@filter false
    if (filters.budget > 0 && venue.priceFrom > filters.budget) return@filter false
    true
}

fun seasonalDestinations(
    month: Int = LocalDate.now(ZoneOffset.UTC).monthValue - 1,
    catalog: List<Destination> = WeddingCatalog.destinations,
): List<Destination> {
    val season = DateFormatSymbols(Locale.US).months[month]
    val matched = catalog.filter { it.seasonalNote.contains(season) }
    return matched.ifEmpty { catalog.take(3) }
}

fun budgetBreakdown(
    weddingPackage: WeddingPackage,
    guests: Int,
    selectedExperienceIds: List<String>,
    catalog: List<Experience> = WeddingCatalog.experiences,
): BudgetBreakdown {
    val extraGuests = (guests - weddingPackage.includedGuests).coerceAtLeast(0)
    val extraCatering = extraGuests * weddingPackage.extraGuestPrice
    val experienceTotal = selectedExperienceIds.sumOf { id -> catalog.find { it.id == id }?.priceFrom ?: 0 }
    return BudgetBreakdown(
        venue = weddingPackage.venueShare,
        accommodation = weddingPackage.accommodationShare,
        catering = weddingPackage.cateringShare + extraCatering,
        decoration = weddingPackage.decorationShare,
        photography = weddingPackage.photographyShare,
        experiences = experienceTotal,
        total = weddingPackage.basePrice + extraCatering + experienceTotal,
    )
}

fun selectedPackage(packageId: String): WeddingPackage =
    WeddingCatalog.packageById(packageId) ?: WeddingCatalog.packages.first()
