import Foundation

/// The products and categories the store sells (spec/features/catalog.md).
protocol CatalogRepository: AnyObject {
    /// All categories, in catalog order.
    func categories() -> [Category]
    /// One category's products, in catalog order.
    func products(categoryId: String) -> [Product]
    /// One product, or nil.
    func product(id: String) -> Product?
    /// Products marked as bestsellers, in catalog order.
    func bestsellers() -> [Product]
    /// Products whose name and category name contain every word of the query (spec/features/search.md).
    func search(_ query: String) -> [Product]
}

/// The catalog bundled with the app. Identical data, in the same order, on every platform.
final class LocalCatalogRepository: CatalogRepository {
    private let allCategories: [Category]
    private let allProducts: [Product]
    private let productsById: [String: Product]
    private let categoryNames: [String: String]

    init() {
        allCategories = Self.categoryData
        allProducts = Self.productData
        productsById = Dictionary(uniqueKeysWithValues: allProducts.map { ($0.id, $0) })
        categoryNames = Dictionary(uniqueKeysWithValues: allCategories.map { ($0.id, $0.name) })
    }

    func categories() -> [Category] { allCategories }

    func products(categoryId: String) -> [Product] {
        allProducts.filter { $0.categoryId == categoryId }
    }

    func product(id: String) -> Product? { productsById[id] }

    func bestsellers() -> [Product] { allProducts.filter(\.isBestseller) }

    func search(_ query: String) -> [Product] {
        let words = query
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .split(whereSeparator: \.isWhitespace)
            .map(String.init)
        guard !words.isEmpty else { return [] }
        return allProducts.filter { product in
            let haystack = (product.name + " " + (categoryNames[product.categoryId] ?? "")).lowercased()
            return words.allSatisfy { haystack.contains($0) }
        }
    }

    // MARK: - Data (spec/features/catalog.md)

    static let categoryData: [Category] = [
        Category(id: "fruits", name: "Fruits & Vegetables", emoji: "🥦"),
        Category(id: "dairy", name: "Dairy, Bread & Eggs", emoji: "🥛"),
        Category(id: "snacks", name: "Snacks & Munchies", emoji: "🍿"),
        Category(id: "drinks", name: "Cold Drinks & Juices", emoji: "🧃"),
        Category(id: "household", name: "Cleaning Essentials", emoji: "🧽"),
        Category(id: "personal", name: "Personal Care", emoji: "🧴"),
    ]

    static let productData: [Product] = [
        Product(id: "banana", name: "Robusta Banana", unit: "6 pcs", price: 49, mrp: 60, emoji: "🍌", categoryId: "fruits", isBestseller: true),
        Product(id: "apple", name: "Shimla Apple", unit: "4 pcs", price: 129, mrp: 160, emoji: "🍎", categoryId: "fruits", isBestseller: true),
        Product(id: "tomato", name: "Hybrid Tomato", unit: "500 g", price: 24, mrp: 30, emoji: "🍅", categoryId: "fruits", isBestseller: false),
        Product(id: "avocado", name: "Hass Avocado", unit: "1 pc", price: 149, mrp: 199, emoji: "🥑", categoryId: "fruits", isBestseller: false),
        Product(id: "carrot", name: "Ooty Carrot", unit: "500 g", price: 39, mrp: 45, emoji: "🥕", categoryId: "fruits", isBestseller: false),
        Product(id: "milk", name: "Toned Milk", unit: "500 ml", price: 28, mrp: 28, emoji: "🥛", categoryId: "dairy", isBestseller: true),
        Product(id: "eggs", name: "Farm Fresh Eggs", unit: "6 pcs", price: 54, mrp: 60, emoji: "🥚", categoryId: "dairy", isBestseller: false),
        Product(id: "bread", name: "Whole Wheat Bread", unit: "400 g", price: 45, mrp: 50, emoji: "🍞", categoryId: "dairy", isBestseller: true),
        Product(id: "cheese", name: "Cheese Slices", unit: "200 g", price: 135, mrp: 150, emoji: "🧀", categoryId: "dairy", isBestseller: false),
        Product(id: "butter", name: "Salted Butter", unit: "100 g", price: 58, mrp: 60, emoji: "🧈", categoryId: "dairy", isBestseller: false),
        Product(id: "chips", name: "Classic Salted Chips", unit: "52 g", price: 20, mrp: 20, emoji: "🍟", categoryId: "snacks", isBestseller: false),
        Product(id: "popcorn", name: "Butter Popcorn", unit: "90 g", price: 45, mrp: 55, emoji: "🍿", categoryId: "snacks", isBestseller: false),
        Product(id: "cookies", name: "Choco Chip Cookies", unit: "150 g", price: 60, mrp: 75, emoji: "🍪", categoryId: "snacks", isBestseller: true),
        Product(id: "chocolate", name: "Dark Chocolate 70%", unit: "100 g", price: 175, mrp: 199, emoji: "🍫", categoryId: "snacks", isBestseller: true),
        Product(id: "pretzels", name: "Salted Pretzels", unit: "100 g", price: 99, mrp: 120, emoji: "🥨", categoryId: "snacks", isBestseller: false),
        Product(id: "cola", name: "Cola Can", unit: "300 ml", price: 40, mrp: 40, emoji: "🥤", categoryId: "drinks", isBestseller: false),
        Product(id: "orange-juice", name: "Fresh Orange Juice", unit: "1 L", price: 125, mrp: 150, emoji: "🍊", categoryId: "drinks", isBestseller: true),
        Product(id: "coconut-water", name: "Tender Coconut Water", unit: "200 ml", price: 55, mrp: 60, emoji: "🥥", categoryId: "drinks", isBestseller: false),
        Product(id: "cold-brew", name: "Cold Brew Coffee", unit: "250 ml", price: 120, mrp: 150, emoji: "☕", categoryId: "drinks", isBestseller: false),
        Product(id: "water", name: "Mineral Water", unit: "1 L", price: 20, mrp: 20, emoji: "💧", categoryId: "drinks", isBestseller: false),
        Product(id: "sponges", name: "Scrub Sponges", unit: "3 pcs", price: 49, mrp: 60, emoji: "🧽", categoryId: "household", isBestseller: false),
        Product(id: "detergent", name: "Liquid Detergent", unit: "1 L", price: 199, mrp: 249, emoji: "🫧", categoryId: "household", isBestseller: true),
        Product(id: "kitchen-towels", name: "Kitchen Towels", unit: "2 rolls", price: 89, mrp: 110, emoji: "🧻", categoryId: "household", isBestseller: false),
        Product(id: "broom", name: "Soft Broom", unit: "1 pc", price: 149, mrp: 199, emoji: "🧹", categoryId: "household", isBestseller: false),
        Product(id: "garbage-bags", name: "Garbage Bags", unit: "30 pcs", price: 79, mrp: 99, emoji: "🗑️", categoryId: "household", isBestseller: false),
        Product(id: "toothpaste", name: "Herbal Toothpaste", unit: "150 g", price: 95, mrp: 110, emoji: "🪥", categoryId: "personal", isBestseller: false),
        Product(id: "shampoo", name: "Daily Shampoo", unit: "340 ml", price: 245, mrp: 299, emoji: "🧴", categoryId: "personal", isBestseller: false),
        Product(id: "soap", name: "Moisturising Soap", unit: "4 × 100 g", price: 160, mrp: 200, emoji: "🧼", categoryId: "personal", isBestseller: true),
        Product(id: "lip-balm", name: "Lip Balm", unit: "4.5 g", price: 99, mrp: 125, emoji: "💄", categoryId: "personal", isBestseller: false),
        Product(id: "razor", name: "Classic Razor", unit: "1 pc", price: 149, mrp: 175, emoji: "🪒", categoryId: "personal", isBestseller: false),
    ]
}
