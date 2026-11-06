package app.features.home

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.features.catalog.WeddingCatalog
import app.features.catalog.parsePositiveInt
import app.features.wedding.WeddingRepository
import app.features.wedding.updatePlan
import kotlinx.coroutines.launch

class HomeViewModel(private val repository: WeddingRepository) : ViewModel() {
    val destinations = WeddingCatalog.destinations
    val experiences = WeddingCatalog.experiences.take(6)
    val packages = WeddingCatalog.packages
    val heroImageUrl = WeddingCatalog.heroImageUrl

    var location by mutableStateOf("")
        private set
    var date by mutableStateOf("")
        private set
    var guests by mutableStateOf("")
        private set
    var budget by mutableStateOf("")
        private set

    fun updateLocation(value: String) {
        location = value
    }

    fun updateDate(value: String) {
        date = value
    }

    fun updateGuests(value: String) {
        guests = value
    }

    fun updateBudget(value: String) {
        budget = value
    }

    fun submitSearch(onDone: () -> Unit) {
        viewModelScope.launch {
            val guestCount = parsePositiveInt(guests)
            val budgetAmount = parsePositiveInt(budget)
            repository.updatePlan { plan ->
                plan.copy(
                    searchLocation = location,
                    searchDate = date,
                    searchGuests = guestCount,
                    searchBudget = budgetAmount,
                    date = date.ifBlank { plan.date },
                    guestCount = guestCount.takeIf { it > 0 } ?: plan.guestCount,
                )
            }
            onDone()
        }
    }
}
