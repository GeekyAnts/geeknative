import CryptoKit
import Foundation

/// The signed-in member.
nonisolated struct Account: Codable, Equatable, Sendable {
    var name: String
    var email: String
    /// ISO 8601 UTC.
    var createdAt: String

    var firstName: String { Initials.firstName(name) }
    var initials: String { Initials.of(name) }
}

nonisolated enum AuthError: Error, Equatable {
    case emailTaken
    case invalidCredentials

    var message: String {
        switch self {
        case .emailTaken: Strings.authErrorEmailTaken
        case .invalidCredentials: Strings.authErrorInvalidCredentials
        }
    }
}

/// Accounts and the session. In this version accounts live on the device.
protocol AuthRepository: AnyObject {
    func currentAccount() -> Account?
    func signUp(name: String, email: String, password: String) async throws -> Account
    func signIn(email: String, password: String) async throws -> Account
    func signOut()
}

/// The stored form of an account (`auth.accounts`), identical on every platform.
nonisolated struct StoredAccount: Codable, Equatable, Sendable {
    var name: String
    var email: String
    var passwordHash: String
    var createdAt: String

    var account: Account { Account(name: name, email: email, createdAt: createdAt) }
}

nonisolated enum AuthStorage {
    static let accountsKey = "auth.accounts"
    static let sessionKey = "auth.session"

    static func normalize(_ email: String) -> String {
        email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    /// Lowercase hex SHA-256 of "<email>:<password>".
    static func passwordHash(email: String, password: String) -> String {
        SHA256.hash(data: Data("\(email):\(password)".utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

/// Shared rules for both implementations, over a list of stored accounts and a session email.
protocol AccountStore: AuthRepository {
    var accounts: [StoredAccount] { get set }
    var session: String? { get set }
    var now: () -> Date { get }
}

extension AccountStore {
    func currentAccount() -> Account? {
        guard let session else { return nil }
        return accounts.first { $0.email == session }?.account
    }

    func signUp(name: String, email: String, password: String) async throws -> Account {
        let email = AuthStorage.normalize(email)
        guard !accounts.contains(where: { $0.email == email }) else { throw AuthError.emailTaken }
        let stored = StoredAccount(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            email: email,
            passwordHash: AuthStorage.passwordHash(email: email, password: password),
            createdAt: Timestamp.string(now())
        )
        accounts.append(stored)
        session = email
        return stored.account
    }

    func signIn(email: String, password: String) async throws -> Account {
        let email = AuthStorage.normalize(email)
        guard let stored = accounts.first(where: { $0.email == email }),
              stored.passwordHash == AuthStorage.passwordHash(email: email, password: password) else {
            throw AuthError.invalidCredentials
        }
        session = email
        return stored.account
    }

    func signOut() {
        session = nil
    }
}

/// Keeps accounts and the session in UserDefaults.
final class UserDefaultsAuthRepository: AccountStore {
    private let defaults: UserDefaults
    let now: () -> Date

    init(defaults: UserDefaults, now: @escaping () -> Date = Date.init) {
        self.defaults = defaults
        self.now = now
    }

    var accounts: [StoredAccount] {
        get {
            guard let data = defaults.string(forKey: AuthStorage.accountsKey)?.data(using: .utf8) else { return [] }
            return (try? JSONDecoder().decode([StoredAccount].self, from: data)) ?? []
        }
        set {
            let data = (try? JSONEncoder().encode(newValue)) ?? Data("[]".utf8)
            defaults.set(String(decoding: data, as: UTF8.self), forKey: AuthStorage.accountsKey)
        }
    }

    var session: String? {
        get { defaults.string(forKey: AuthStorage.sessionKey) }
        set {
            if let newValue { defaults.set(newValue, forKey: AuthStorage.sessionKey) } else { defaults.removeObject(forKey: AuthStorage.sessionKey) }
        }
    }
}

/// Keeps accounts in memory, for previews and tests.
final class InMemoryAuthRepository: AccountStore {
    var accounts: [StoredAccount]
    var session: String?
    let now: () -> Date

    init(accounts: [StoredAccount] = [], session: String? = nil, now: @escaping () -> Date = Date.init) {
        self.accounts = accounts
        self.session = session
        self.now = now
    }

    /// A repository with one signed-in member.
    static func signedIn(name: String, email: String, password: String, createdAt: String, now: @escaping () -> Date = Date.init) -> InMemoryAuthRepository {
        let email = AuthStorage.normalize(email)
        let stored = StoredAccount(name: name, email: email, passwordHash: AuthStorage.passwordHash(email: email, password: password), createdAt: createdAt)
        return InMemoryAuthRepository(accounts: [stored], session: email, now: now)
    }
}

/// Field validation for Sign in and Sign up.
nonisolated enum AuthValidator {
    static let minimumPasswordLength = 8

    static func nameError(_ name: String) -> String? {
        name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? Strings.authErrorNameRequired : nil
    }

    static func emailError(_ email: String) -> String? {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.wholeMatch(of: /[^\s@]+@[^\s@]+\.[^\s@]+/) == nil ? Strings.authErrorEmailInvalid : nil
    }

    static func passwordError(_ password: String) -> String? {
        password.count < minimumPasswordLength ? Strings.authErrorPasswordShort : nil
    }
}
