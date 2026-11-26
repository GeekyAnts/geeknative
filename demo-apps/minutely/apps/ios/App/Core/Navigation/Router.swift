import Observation

/// The app's one navigation stack, rooted at Home (spec/navigation.md).
/// View models navigate through it, so tests can check where an action leads.
@Observable
final class Router {
    var path: [Route]

    init(path: [Route] = []) {
        self.path = path
    }

    func push(_ route: Route) {
        path.append(route)
    }

    /// Swaps the top screen, for example Cart for Order placed, so Back skips it.
    func replaceLast(with route: Route) {
        if path.isEmpty {
            path.append(route)
        } else {
            path[path.count - 1] = route
        }
    }

    /// Back to Home.
    func popToRoot() {
        path.removeAll()
    }
}
