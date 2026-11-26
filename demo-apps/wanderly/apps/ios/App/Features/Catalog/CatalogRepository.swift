import Foundation
import Observation

protocol CatalogRepository: AnyObject {
    var catalog: Catalog { get }
    var loadFailed: Bool { get }
    func reload()
}

/// Loads `catalog.json` from the app bundle.
@Observable
final class BundleCatalogRepository: CatalogRepository {
    private(set) var catalog: Catalog
    private(set) var loadFailed: Bool

    init() {
        do {
            catalog = try Catalog.loadFromBundle()
            loadFailed = false
        } catch {
            catalog = .empty
            loadFailed = true
        }
    }

    func reload() {
        do {
            catalog = try Catalog.loadFromBundle()
            loadFailed = false
        } catch {
            catalog = .empty
            loadFailed = true
        }
    }
}

/// In-memory catalog for tests and previews. Decodes the same JSON as the live repository.
@Observable
final class InMemoryCatalogRepository: CatalogRepository {
    private(set) var catalog: Catalog
    private(set) var loadFailed: Bool

    init(catalog: Catalog = .empty, loadFailed: Bool = false) {
        self.catalog = catalog
        self.loadFailed = loadFailed
    }

    static func bundled() -> InMemoryCatalogRepository {
        do {
            return InMemoryCatalogRepository(catalog: try Catalog.loadFromBundle())
        } catch {
            return InMemoryCatalogRepository(catalog: .empty, loadFailed: true)
        }
    }

    func reload() {
        guard loadFailed else { return }
        do {
            catalog = try Catalog.loadFromBundle()
            loadFailed = false
        } catch {
            catalog = .empty
            loadFailed = true
        }
    }
}
