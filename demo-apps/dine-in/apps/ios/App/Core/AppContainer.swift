import Foundation
import Observation

/// The app's dependencies, created once at launch. Screens read it from the environment.
/// Swap an implementation here (for example, a backend-backed repository) without touching screens.
@Observable
final class AppContainer {
    let settingsRepository: any SettingsRepository
    let authRepository: any AuthRepository
    let catalogRepository: any CatalogRepository
    let exploreRepository: any ExploreRepository
    /// The clock. Everything time-dependent reads it, so tests can fix the time.
    @ObservationIgnored let now: () -> Date
    @ObservationIgnored private let makeMemberRepositories: (Account) -> MemberRepositories

    /// The signed-in member's session; nil when signed out.
    private(set) var session: MemberSession?

    init(
        settingsRepository: any SettingsRepository,
        authRepository: any AuthRepository,
        catalogRepository: any CatalogRepository,
        exploreRepository: any ExploreRepository,
        now: @escaping () -> Date,
        makeMemberRepositories: @escaping (Account) -> MemberRepositories
    ) {
        self.settingsRepository = settingsRepository
        self.authRepository = authRepository
        self.catalogRepository = catalogRepository
        self.exploreRepository = exploreRepository
        self.now = now
        self.makeMemberRepositories = makeMemberRepositories
        if let account = authRepository.currentAccount() {
            session = makeSession(account)
        }
    }

    /// Replaces the signed-out stack with the main tabs on Discover.
    func didSignIn(_ account: Account) {
        session = makeSession(account)
    }

    /// Clears the session only; the member's data stays on the device under their email.
    func signOut() {
        authRepository.signOut()
        session = nil
    }

    private func makeSession(_ account: Account) -> MemberSession {
        MemberSession(
            account: account,
            repositories: makeMemberRepositories(account),
            catalogRepository: catalogRepository,
            exploreRepository: exploreRepository,
            now: now
        )
    }

    static func live() -> AppContainer {
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains(UITesting.flag) || arguments.contains(UITesting.screenshotScreenFlag) {
            return uiTesting(arguments: arguments)
        }
        let defaults = UserDefaults.standard
        return AppContainer(
            settingsRepository: UserDefaultsSettingsRepository(defaults: defaults),
            authRepository: UserDefaultsAuthRepository(defaults: defaults),
            catalogRepository: BundledCatalogRepository(),
            exploreRepository: UserDefaultsExploreRepository(defaults: defaults),
            now: Date.init
        ) { account in
            MemberRepositories(
                reservations: UserDefaultsReservationsRepository(defaults: defaults, email: account.email),
                saved: UserDefaultsSavedRepository(defaults: defaults, email: account.email),
                preferences: UserDefaultsPreferencesRepository(defaults: defaults, email: account.email)
            )
        }
    }

    /// In-memory dependencies, for previews and tests. Signed in as a sample member by default.
    static func preview(signedIn: Bool = true, reservations: [Reservation] = [], saved: [String] = [], preferences: DiningPreferences = .defaults, appearance: Appearance = .system, now: @escaping () -> Date = Date.init) -> AppContainer {
        let auth = signedIn ? InMemoryAuthRepository.signedIn(name: UITesting.memberName, email: UITesting.memberEmail, password: UITesting.memberPassword, createdAt: UITesting.memberCreatedAt, now: now) : InMemoryAuthRepository(now: now)
        return AppContainer(
            settingsRepository: InMemorySettingsRepository(appearance: appearance),
            authRepository: auth,
            catalogRepository: InMemoryCatalogRepository(),
            exploreRepository: InMemoryExploreRepository(),
            now: now
        ) { _ in
            MemberRepositories(
                reservations: InMemoryReservationsRepository(reservations: reservations, now: now),
                saved: InMemorySavedRepository(ids: saved),
                preferences: InMemoryPreferencesRepository(preferences: preferences)
            )
        }
    }
}

/// The repositories that belong to one member (stored under their email).
struct MemberRepositories {
    let reservations: any ReservationsRepository
    let saved: any SavedRepository
    let preferences: any PreferencesRepository
}

/// Everything a signed-in screen needs: the member, their repositories, shared repositories, the
/// clock and the navigation state of the signed-in stack.
@Observable
final class MemberSession {
    let account: Account
    let reservationsRepository: any ReservationsRepository
    let savedRepository: any SavedRepository
    let preferencesRepository: any PreferencesRepository
    let catalogRepository: any CatalogRepository
    let exploreRepository: any ExploreRepository
    @ObservationIgnored let now: () -> Date
    let router = AppRouter()

    init(account: Account, repositories: MemberRepositories, catalogRepository: any CatalogRepository, exploreRepository: any ExploreRepository, now: @escaping () -> Date) {
        self.account = account
        reservationsRepository = repositories.reservations
        savedRepository = repositories.saved
        preferencesRepository = repositories.preferences
        self.catalogRepository = catalogRepository
        self.exploreRepository = exploreRepository
        self.now = now
    }

    /// A sample signed-in session, for previews.
    static func preview(reservations: [Reservation] = UITesting.sampleReservations(), saved: [String] = ["koyo"], preferences: DiningPreferences = .defaults) -> MemberSession {
        let container = AppContainer.preview(reservations: reservations, saved: saved, preferences: preferences, now: UITesting.fixedNow)
        return container.session!
    }
}
