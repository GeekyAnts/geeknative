import Foundation

/// A product as it was when ordered, so an order still reads correctly if the catalog changes.
nonisolated struct OrderLine: Codable, Hashable, Sendable {
    let productId: String
    let name: String
    let unit: String
    let emoji: String
    let categoryId: String
    let price: Int
    let mrp: Int
    let quantity: Int

    var lineTotal: Int { price * quantity }
}

/// A placed cart. Field names match the stored JSON on every platform (spec/features/order.md).
nonisolated struct Order: Codable, Hashable, Sendable, Identifiable {
    let id: String
    /// Milliseconds since 1970.
    let placedAt: Int
    let lines: [OrderLine]
    let itemCount: Int
    let itemTotal: Int
    let savings: Int
    let deliveryFee: Int
    let toPay: Int

    /// `MN` followed by `placedAt % 1000000`, zero-padded to 6 digits: 1761800123456 → MN123456.
    static func id(placedAt: Int) -> String {
        let suffix = String(placedAt % 1_000_000)
        return "MN" + String(repeating: "0", count: max(0, 6 - suffix.count)) + suffix
    }

    /// Builds an order from cart lines, copying each product's current details.
    @MainActor static func make(lines cartLines: [CartLine], catalog: any CatalogRepository, placedAt: Int) -> Order {
        let products = cartLines.compactMap { line in catalog.product(id: line.productId).map { (line, $0) } }
        let lines = products.map { line, product in
            OrderLine(
                productId: product.id, name: product.name, unit: product.unit, emoji: product.emoji,
                categoryId: product.categoryId, price: product.price, mrp: product.mrp, quantity: line.quantity
            )
        }
        let summary = CartSummary(lines: cartLines, catalog: catalog)
        return Order(
            id: id(placedAt: placedAt),
            placedAt: placedAt,
            lines: lines,
            itemCount: summary.itemCount,
            itemTotal: summary.itemTotal,
            savings: summary.savings,
            deliveryFee: summary.deliveryFee,
            toPay: summary.toPay
        )
    }
}
