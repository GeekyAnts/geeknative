package app.features.catalog

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow

/** The catalog as a screen sees it: loading, loaded or failed (with retry). */
sealed interface CatalogLoad {
    data object Loading : CatalogLoad

    data class Loaded(val catalog: Catalog) : CatalogLoad

    data object Failed : CatalogLoad
}

/** Loads the catalog each time [retry] changes; bump it to try again after a failure. */
class CatalogLoader(private val repository: CatalogRepository) {
    private val attempts = MutableStateFlow(0)

    @OptIn(ExperimentalCoroutinesApi::class)
    val state: Flow<CatalogLoad> = attempts.flatMapLatest {
        flow {
            emit(CatalogLoad.Loading)
            emit(runCatching { repository.load() }.fold({ CatalogLoad.Loaded(it) }, { CatalogLoad.Failed }))
        }
    }

    fun retry() {
        attempts.value++
    }
}
