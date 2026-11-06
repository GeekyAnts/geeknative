import Foundation
import Observation

protocol WeddingRepository: AnyObject {
    var plan: WeddingPlan { get }
    var enquiries: [Enquiry] { get }
    func savePlan(_ plan: WeddingPlan)
    func update(_ patch: WeddingPlanPatch)
    func addEnquiry(_ enquiry: Enquiry)
}

extension WeddingRepository {
    func update(_ patch: WeddingPlanPatch) {
        savePlan(mergePlan(plan, patch))
    }
}

/// Keeps the wedding plan and enquiries in UserDefaults under the shared storage keys.
@Observable
final class UserDefaultsWeddingRepository: WeddingRepository {
    private(set) var plan: WeddingPlan
    private(set) var enquiries: [Enquiry]
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults) {
        self.defaults = defaults
        plan = Self.parsePlan(defaults.string(forKey: WeddingPlan.planStorageKey))
        enquiries = Self.parseEnquiries(defaults.string(forKey: WeddingPlan.enquiriesStorageKey))
    }

    func savePlan(_ plan: WeddingPlan) {
        self.plan = plan
        if let data = try? JSONEncoder().encode(plan), let raw = String(data: data, encoding: .utf8) {
            defaults.set(raw, forKey: WeddingPlan.planStorageKey)
        }
    }

    func addEnquiry(_ enquiry: Enquiry) {
        enquiries.append(enquiry)
        if let data = try? JSONEncoder().encode(enquiries), let raw = String(data: data, encoding: .utf8) {
            defaults.set(raw, forKey: WeddingPlan.enquiriesStorageKey)
        }
    }

    static func parsePlan(_ raw: String?) -> WeddingPlan {
        guard let raw, let data = raw.data(using: .utf8) else { return .empty }
        do {
            var plan = try JSONDecoder().decode(WeddingPlan.self, from: data)
            if plan.guestCount == 0 {
                plan.guestCount = WeddingPlan.empty.guestCount
            }
            return plan
        } catch {
            return .empty
        }
    }

    static func parseEnquiries(_ raw: String?) -> [Enquiry] {
        guard let raw, let data = raw.data(using: .utf8) else { return [] }
        return (try? JSONDecoder().decode([Enquiry].self, from: data)) ?? []
    }
}

/// Keeps the wedding plan in memory, for previews and tests.
@Observable
final class InMemoryWeddingRepository: WeddingRepository {
    private(set) var plan: WeddingPlan
    private(set) var enquiries: [Enquiry]

    init(plan: WeddingPlan = .empty, enquiries: [Enquiry] = []) {
        self.plan = plan
        self.enquiries = enquiries
    }

    func savePlan(_ plan: WeddingPlan) {
        self.plan = plan
    }

    func addEnquiry(_ enquiry: Enquiry) {
        enquiries.append(enquiry)
    }
}
