import Foundation

/// Reads the restaurant catalog. A backend later adds `RemoteCatalogRepository`; nothing else changes.
protocol CatalogRepository: AnyObject {
    func load() async throws -> Catalog
}

nonisolated enum CatalogError: Error {
    case missing
}

/// Parses the bundled catalog.json once and caches the result.
final class BundledCatalogRepository: CatalogRepository {
    private let bundle: Bundle
    private var cached: Catalog?

    init(bundle: Bundle = .main) {
        self.bundle = bundle
    }

    func load() async throws -> Catalog {
        if let cached { return cached }
        let catalog = try Self.decodeBundled(bundle)
        cached = catalog
        return catalog
    }

    nonisolated static func decodeBundled(_ bundle: Bundle = .main) throws -> Catalog {
        guard let url = bundle.url(forResource: "catalog", withExtension: "json") else { throw CatalogError.missing }
        return try JSONDecoder().decode(Catalog.self, from: Data(contentsOf: url))
    }
}

/// A fixed catalog, for tests and previews. Defaults to the bundled one.
final class InMemoryCatalogRepository: CatalogRepository {
    private let result: Result<Catalog, any Error>

    init(catalog: Catalog? = nil) {
        if let catalog {
            result = .success(catalog)
        } else {
            result = Result { try BundledCatalogRepository.decodeBundled() }
        }
    }

    init(error: any Error) {
        result = .failure(error)
    }

    func load() async throws -> Catalog {
        try result.get()
    }
}
