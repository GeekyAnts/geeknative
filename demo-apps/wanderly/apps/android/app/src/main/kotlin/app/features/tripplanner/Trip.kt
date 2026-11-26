package app.features.tripplanner

import app.features.catalog.BudgetEstimate
import app.features.catalog.Destination
import app.features.catalog.ItineraryTemplate
import app.features.catalog.Place
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID
import kotlinx.serialization.Serializable

@Serializable
data class Trip(
    val id: String,
    val destinationId: String,
    val title: String,
    val startDate: String,
    val endDate: String,
    val travelers: Int,
    val budgetBand: String,
    val interests: List<String>,
    val status: String,
    val days: List<TripDay>,
)

@Serializable
data class TripDay(
    val dayIndex: Int,
    val date: String,
    val items: List<TripItem>,
)

@Serializable
data class TripItem(
    val id: String,
    val placeId: String,
    val startTime: String,
    val durationMinutes: Int,
    val completed: Boolean,
)

enum class TripSegment(val id: String) {
    Upcoming("upcoming"),
    Past("past"),
    Drafts("drafts"),
}

data class BudgetBreakdown(
    val lodging: Int,
    val food: Int,
    val activities: Int,
    val total: Int,
    val symbol: String,
)

sealed interface GenerateResult {
    data class Success(val trip: Trip) : GenerateResult
    data object MissingDestination : GenerateResult
    data object MissingDates : GenerateResult
    data object InvalidDateRange : GenerateResult
    data object RangeTooLong : GenerateResult
}

data class GenerateRequest(
    val destinationId: String?,
    val startDate: LocalDate?,
    val endDate: LocalDate?,
    val travelers: Int,
    val budgetBand: String,
    val interests: List<String>,
)

fun inclusiveDays(start: LocalDate, end: LocalDate): Int =
    ChronoUnit.DAYS.between(start, end).toInt() + 1

fun itineraryDayCount(start: LocalDate, end: LocalDate): Int =
    minOf(maxOf(inclusiveDays(start, end), 1), 7)

fun classifyTrip(trip: Trip, today: LocalDate): TripSegment {
    if (trip.status == "draft") return TripSegment.Drafts
    val end = runCatching { LocalDate.parse(trip.endDate) }.getOrNull() ?: return TripSegment.Upcoming
    return if (end.isBefore(today)) TripSegment.Past else TripSegment.Upcoming
}

fun rewriteStatusOnRead(trip: Trip, today: LocalDate): Trip {
    if (trip.status == "draft") return trip
    val end = runCatching { LocalDate.parse(trip.endDate) }.getOrNull() ?: return trip
    return if (end.isBefore(today) && trip.status != "past") trip.copy(status = "past") else trip
}

fun saveTripStatus(endDate: String, today: LocalDate): String {
    val end = runCatching { LocalDate.parse(endDate) }.getOrNull() ?: return "upcoming"
    return if (!end.isBefore(today)) "upcoming" else "past"
}

fun estimateBudget(
    destination: Destination,
    budgetBand: String,
    days: Int,
    travelers: Int,
): BudgetBreakdown {
    val estimates: BudgetEstimate = destination.budgetEstimates[budgetBand]
        ?: destination.budgetEstimates["mid"]
        ?: BudgetEstimate(0, 0, 0)
    val lodging = estimates.lodging * days
    val food = estimates.food * days * travelers
    val activities = estimates.activities * days * travelers
    return BudgetBreakdown(
        lodging = lodging,
        food = food,
        activities = activities,
        total = lodging + food + activities,
        symbol = destination.currencySymbol,
    )
}

fun generateTrip(
    request: GenerateRequest,
    destination: Destination?,
    placesById: Map<String, Place>,
    id: String = UUID.randomUUID().toString(),
    newItemId: () -> String = { UUID.randomUUID().toString() },
): GenerateResult {
    if (request.destinationId.isNullOrBlank() || destination == null) {
        return GenerateResult.MissingDestination
    }
    val start = request.startDate
    val end = request.endDate
    if (start == null || end == null) return GenerateResult.MissingDates
    if (end.isBefore(start)) return GenerateResult.InvalidDateRange
    if (inclusiveDays(start, end) > 14) return GenerateResult.RangeTooLong

    val days = itineraryDayCount(start, end)
    val templates = destination.itineraryTemplates
    val tripDays = (0 until days).map { d ->
        val template = if (templates.isEmpty()) {
            ItineraryTemplate()
        } else {
            templates[d % templates.size]
        }
        var items = template.items.map { item ->
            TripItem(
                id = newItemId(),
                placeId = item.placeId,
                startTime = item.startTime,
                durationMinutes = item.durationMinutes,
                completed = false,
            )
        }
        if (request.interests.isNotEmpty()) {
            items = items.sortedBy { item ->
                val category = placesById[item.placeId]?.category
                if (category != null && category in request.interests) 0 else 1
            }
        }
        TripDay(
            dayIndex = d + 1,
            date = start.plusDays(d.toLong()).toString(),
            items = items,
        )
    }

    return GenerateResult.Success(
        Trip(
            id = id,
            destinationId = destination.id,
            title = destination.name,
            startDate = start.toString(),
            endDate = end.toString(),
            travelers = request.travelers.coerceIn(1, 8),
            budgetBand = request.budgetBand,
            interests = request.interests,
            status = "draft",
            days = tripDays,
        ),
    )
}

fun addItemToDay(day: TripDay, place: Place, newItemId: () -> String = { UUID.randomUUID().toString() }): TripDay {
    val startTime = if (day.items.any { it.startTime == "09:00" }) "18:00" else "09:00"
    val item = TripItem(
        id = newItemId(),
        placeId = place.id,
        startTime = startTime,
        durationMinutes = place.durationMinutes,
        completed = false,
    )
    return day.copy(items = day.items + item)
}

fun appendPlaceToDayOne(trip: Trip, place: Place, newItemId: () -> String = { UUID.randomUUID().toString() }): Trip {
    val existing = trip.days.firstOrNull { it.dayIndex == 1 }
    val item = TripItem(
        id = newItemId(),
        placeId = place.id,
        startTime = "09:00",
        durationMinutes = place.durationMinutes,
        completed = false,
    )
    val day = if (existing == null) {
        TripDay(dayIndex = 1, date = trip.startDate, items = listOf(item))
    } else {
        existing.copy(items = existing.items + item)
    }
    val days = if (existing == null) listOf(day) + trip.days else trip.days.map { if (it.dayIndex == 1) day else it }
    return trip.copy(days = days)
}

fun moveItem(day: TripDay, itemId: String, delta: Int): TripDay {
    val index = day.items.indexOfFirst { it.id == itemId }
    val target = index + delta
    if (index < 0 || target !in day.items.indices) return day
    val items = day.items.toMutableList()
    val item = items.removeAt(index)
    items.add(target, item)
    return day.copy(items = items)
}
