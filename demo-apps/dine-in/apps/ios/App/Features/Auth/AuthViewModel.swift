import Foundation
import Observation

/// State and actions for Sign in and Sign up.
@Observable
final class AuthViewModel {
    enum Mode { case signIn, signUp }

    let mode: Mode
    var name = ""
    var email = ""
    var password = ""
    private(set) var submitted = false
    private(set) var isSubmitting = false
    private(set) var formError: String?
    @ObservationIgnored private let repository: any AuthRepository
    @ObservationIgnored private let onSignedIn: (Account) -> Void

    init(mode: Mode, repository: any AuthRepository, onSignedIn: @escaping (Account) -> Void) {
        self.mode = mode
        self.repository = repository
        self.onSignedIn = onSignedIn
    }

    convenience init(mode: Mode, container: AppContainer) {
        self.init(mode: mode, repository: container.authRepository) { [weak container] account in
            container?.didSignIn(account)
        }
    }

    // Field errors show after the first submit attempt and update as the member types.
    var nameError: String? { submitted && mode == .signUp ? AuthValidator.nameError(name) : nil }
    var emailError: String? { submitted ? AuthValidator.emailError(email) : nil }
    var passwordError: String? { submitted ? AuthValidator.passwordError(password) : nil }

    private var isValid: Bool {
        (mode == .signIn || AuthValidator.nameError(name) == nil)
            && AuthValidator.emailError(email) == nil
            && AuthValidator.passwordError(password) == nil
    }

    func submit() async {
        guard !isSubmitting else { return }
        submitted = true
        formError = nil
        guard isValid else { return }
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            let account = switch mode {
            case .signIn: try await repository.signIn(email: email, password: password)
            case .signUp: try await repository.signUp(name: name, email: email, password: password)
            }
            onSignedIn(account)
        } catch let error as AuthError {
            formError = error.message
        } catch {
            formError = Strings.commonErrorBody
        }
    }
}
