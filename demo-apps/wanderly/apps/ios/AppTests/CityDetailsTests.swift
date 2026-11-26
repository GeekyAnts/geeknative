import Testing
@testable import App

@Suite("City details")
struct CityDetailsTests {
    private func makeViewModel(id: String, saved: InMemorySavedRepository = InMemorySavedRepository()) -> CityDetailsViewModel {
        let container = AppContainer(
            settingsRepository: InMemorySettingsRepository(),
            catalogRepository: InMemoryCatalogRepository.bundled(),
            savedRepository: saved,
            tripRepository: InMemoryTripRepository(),
            profileRepository: InMemoryProfileRepository()
        )
        return CityDetailsViewModel(destinationId: id, container: container)
    }

    @Test("AC-city-details-1: City details shows the cover photograph, name, country and description")
    func coverAndStory() {
        let viewModel = makeViewModel(id: "bali")
        let destination = viewModel.destination
        #expect(destination?.name == "Bali")
        #expect(destination?.country == "Indonesia")
        #expect(destination?.description.isEmpty == false)
        #expect(destination?.imageUrl.isEmpty == false)
        #expect(!viewModel.isUnknown)
    }

    @Test("AC-city-details-2: City details shows best time to visit, weather, currency and language")
    func facts() throws {
        let viewModel = makeViewModel(id: "bali")
        let destination = try #require(viewModel.destination)
        #expect(!destination.bestTimeToVisit.isEmpty)
        #expect(!viewModel.weatherValue(for: destination).isEmpty)
        #expect(viewModel.currencyValue(for: destination).contains(destination.currency))
        #expect(!destination.language.isEmpty)
    }

    @Test("AC-city-details-3: City details shows attractions, hotels, restaurants and activities, each with a photograph")
    func collections() {
        let viewModel = makeViewModel(id: "bali")
        for places in [viewModel.attractions(), viewModel.hotels(), viewModel.restaurants(), viewModel.activities()] {
            #expect(!places.isEmpty)
            #expect(places.allSatisfy { !$0.imageUrl.isEmpty && !$0.name.isEmpty })
        }
    }

    @Test("AC-city-details-6: The save control adds and removes the destination from Saved")
    func saveToggle() {
        let saved = InMemorySavedRepository()
        let viewModel = makeViewModel(id: "bali", saved: saved)
        #expect(!viewModel.isSaved)
        viewModel.toggleSave()
        #expect(viewModel.isSaved)
        #expect(saved.items.contains { $0.id == "bali" && $0.kind == .destination })
        viewModel.toggleSave()
        #expect(!viewModel.isSaved)
        #expect(saved.items.isEmpty)
    }

    @Test("AC-city-details-7: An unknown destination id shows the error state")
    func unknownId() {
        let viewModel = makeViewModel(id: "not-a-city")
        #expect(viewModel.isUnknown)
        #expect(viewModel.destination == nil)
    }
}
