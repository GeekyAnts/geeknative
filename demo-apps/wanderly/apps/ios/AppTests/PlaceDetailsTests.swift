import Testing
@testable import App

@Suite("Place details")
struct PlaceDetailsTests {
    private func makeViewModel(id: String, saved: InMemorySavedRepository = InMemorySavedRepository()) -> PlaceDetailsViewModel {
        let container = AppContainer(
            settingsRepository: InMemorySettingsRepository(),
            catalogRepository: InMemoryCatalogRepository.bundled(),
            savedRepository: saved,
            tripRepository: InMemoryTripRepository(),
            profileRepository: InMemoryProfileRepository()
        )
        return PlaceDetailsViewModel(placeId: id, container: container)
    }

    @Test("AC-place-details-1: Place details shows a photograph, name, rating, location, description, opening hours and duration")
    func details() throws {
        let viewModel = makeViewModel(id: "paris-eiffel")
        let place = try #require(viewModel.place)
        #expect(place.name == "Eiffel Tower")
        #expect(!place.imageUrl.isEmpty)
        #expect(place.rating > 0)
        #expect(!place.location.isEmpty)
        #expect(!place.description.isEmpty)
        #expect(!place.openingHours.isEmpty)
        #expect(place.durationMinutes > 0)
        #expect(viewModel.durationText(for: place).contains(AppFormat.int(place.durationMinutes)))
        #expect(!viewModel.ratingText(for: place).isEmpty)
    }

    @Test("AC-place-details-2: Save adds and removes the place from Saved")
    func saveToggle() {
        let saved = InMemorySavedRepository()
        let viewModel = makeViewModel(id: "paris-eiffel", saved: saved)
        viewModel.toggleSave()
        #expect(viewModel.isSaved)
        #expect(saved.items.contains { $0.id == "paris-eiffel" && $0.kind == .attraction })
        viewModel.toggleSave()
        #expect(!viewModel.isSaved)
        #expect(saved.items.isEmpty)
    }

    @Test("AC-place-details-4: An unknown place id shows the error state")
    func unknownId() {
        let viewModel = makeViewModel(id: "missing-place")
        #expect(viewModel.isUnknown)
        #expect(viewModel.place == nil)
    }
}
