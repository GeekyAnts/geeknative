package app.features.catalog

import androidx.annotation.StringRes
import app.R
import kotlinx.serialization.Serializable

enum class WeddingStyle(val id: String, @StringRes val label: Int) {
    Beach("beach", R.string.style_beach),
    Royal("royal", R.string.style_royal),
    Garden("garden", R.string.style_garden),
    Mountain("mountain", R.string.style_mountain),
    Heritage("heritage", R.string.style_heritage),
    LuxuryResort("luxuryResort", R.string.style_luxury_resort);

    companion object {
        val all = entries
        fun fromId(id: String): WeddingStyle? = entries.firstOrNull { it.id == id }
    }
}

enum class BookingStatus(val id: String, @StringRes val label: Int) {
    None("none", R.string.wedding_status_none),
    EnquirySent("enquirySent", R.string.wedding_status_enquiry_sent),
    Confirmed("confirmed", R.string.wedding_status_confirmed);

    companion object {
        fun fromId(id: String?): BookingStatus = entries.firstOrNull { it.id == id } ?: None
    }
}

enum class TaskId(val id: String, @StringRes val label: Int) {
    Venue("venue", R.string.wedding_task_venue),
    Guests("guests", R.string.wedding_task_guests),
    Attire("attire", R.string.wedding_task_attire),
    Photography("photography", R.string.wedding_task_photography),
    Catering("catering", R.string.wedding_task_catering),
    Decor("decor", R.string.wedding_task_decor),
    Invitations("invitations", R.string.wedding_task_invitations),
    Travel("travel", R.string.wedding_task_travel),
    Ceremony("ceremony", R.string.wedding_task_ceremony),
    Reception("reception", R.string.wedding_task_reception);

    companion object {
        val all = entries
    }
}

data class Destination(
    val id: String,
    val name: String,
    val country: String,
    val region: String,
    val tagline: String,
    val description: String,
    val seasonalNote: String,
    val styles: List<String>,
    val guestCapacityMin: Int,
    val guestCapacityMax: Int,
    val budgetMin: Int,
    val imageUrl: String,
    val gallery: List<String>,
    val venueIds: List<String>,
    val packageIds: List<String>,
)

data class Review(
    val author: String,
    val rating: Int,
    val body: String,
)

data class Venue(
    val id: String,
    val destinationId: String,
    val name: String,
    val description: String,
    val highlights: List<String>,
    val location: String,
    val latitude: Double,
    val longitude: Double,
    val capacity: Int,
    val spaces: List<String>,
    val accommodation: String,
    val amenities: List<String>,
    val priceFrom: Int,
    val packageIds: List<String>,
    val rating: Double,
    val reviewCount: Int,
    val reviews: List<Review>,
    val imageUrl: String,
    val gallery: List<String>,
)

data class Experience(
    val id: String,
    val name: String,
    val description: String,
    val priceFrom: Int,
    val imageUrl: String,
    val icon: String,
)

data class WeddingPackage(
    val id: String,
    val name: String,
    val description: String,
    val includedGuests: Int,
    val extraGuestPrice: Int,
    val basePrice: Int,
    val venueShare: Int,
    val accommodationShare: Int,
    val cateringShare: Int,
    val decorationShare: Int,
    val photographyShare: Int,
    val includes: List<String>,
    val imageUrl: String,
)

@Serializable
data class Enquiry(
    val id: String,
    val venueId: String = "",
    val experienceId: String = "",
    val coupleName: String,
    val email: String,
    val date: String = "",
    val guests: Int = 0,
    val message: String,
    val createdAt: String,
)

@Serializable
data class WeddingPlan(
    val date: String = "",
    val destinationId: String = "",
    val venueId: String = "",
    val guestCount: Int = 80,
    val budget: Int = 0,
    val packageId: String = "",
    val bookingStatus: String = BookingStatus.None.id,
    val savedDestinationIds: List<String> = emptyList(),
    val savedVenueIds: List<String> = emptyList(),
    val completedTaskIds: List<String> = emptyList(),
    val selectedExperienceIds: List<String> = emptyList(),
    val searchLocation: String = "",
    val searchDate: String = "",
    val searchGuests: Int = 0,
    val searchBudget: Int = 0,
) {
    val status: BookingStatus get() = BookingStatus.fromId(bookingStatus)

    companion object {
        val Empty = WeddingPlan()
        const val PLAN_STORAGE_KEY = "wedding.plan"
        const val ENQUIRIES_STORAGE_KEY = "wedding.enquiries"
    }
}

data class BudgetBreakdown(
    val venue: Int,
    val accommodation: Int,
    val catering: Int,
    val decoration: Int,
    val photography: Int,
    val experiences: Int,
    val total: Int,
)

data class EnquiryDraft(
    val coupleName: String = "",
    val email: String = "",
    val date: String = "",
    val guests: String = "",
    val message: String = "",
) {
    val isValid: Boolean
        get() = coupleName.trim().isNotEmpty() && email.contains('@') && message.trim().isNotEmpty()
}

fun List<String>.toggled(id: String): List<String> = if (contains(id)) filter { it != id } else this + id
