import Foundation
import Testing
@testable import App

@Suite("Experiences")
struct ExperiencesTests {
    @Test("AC-experiences-1: Experiences shows every catalog service")
    func showsEveryService() {
        #expect(WeddingCatalog.experiences.count == 10)
        #expect(WeddingCatalog.experiences.map(\.id) == [
            "photography",
            "florals",
            "catering",
            "planner",
            "makeup",
            "entertainment",
            "accommodation",
            "transport",
            "prewedding",
            "rituals",
        ])
    }

    @Test("AC-experiences-2: Submitting a valid experience enquiry records it and selects that experience on the wedding plan")
    func enquirySelectsExperience() {
        let repository = InMemoryWeddingRepository()
        repository.addEnquiry(
            Enquiry(
                id: "1",
                venueId: "",
                experienceId: "photography",
                coupleName: "A & B",
                email: "a@b.com",
                date: "",
                guests: 0,
                message: "Please",
                createdAt: "2026-01-01"
            )
        )
        repository.update(WeddingPlanPatch(selectedExperienceIds: ["photography"]))
        #expect(repository.enquiries.first?.experienceId == "photography")
        #expect(repository.plan.selectedExperienceIds.contains("photography"))
    }
}
