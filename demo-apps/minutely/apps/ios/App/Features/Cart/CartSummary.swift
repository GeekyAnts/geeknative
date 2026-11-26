import Foundation

/// The cart's totals, computed from its lines and the catalog (spec/features/cart.md, Cart summary).
/// A pure value, so every platform tests the same math.
nonisolated struct CartSummary: Equatable, Sendable {
    let itemCount: Int
    let itemTotal: Int
    let mrpTotal: Int
    let savings: Int
    let deliveryFee: Int
    let toPay: Int
    let amountToFreeDelivery: Int
    let freeDeliveryThreshold: Int

    static let empty = CartSummary(lines: [], products: [:])

    /// - Parameters:
    ///   - products: the catalog's products by id. Lines for unknown products are ignored.
    init(
        lines: [CartLine],
        products: [String: Product],
        freeDeliveryThreshold: Int = AppConfig.freeDeliveryThreshold,
        deliveryFee: Int = AppConfig.deliveryFee
    ) {
        var itemCount = 0, itemTotal = 0, mrpTotal = 0
        for line in lines {
            guard let product = products[line.productId] else { continue }
            itemCount += line.quantity
            itemTotal += product.price * line.quantity
            mrpTotal += product.mrp * line.quantity
        }
        self.itemCount = itemCount
        self.itemTotal = itemTotal
        self.mrpTotal = mrpTotal
        self.savings = mrpTotal - itemTotal
        self.deliveryFee = (itemCount == 0 || itemTotal >= freeDeliveryThreshold) ? 0 : deliveryFee
        self.toPay = itemTotal + self.deliveryFee
        self.amountToFreeDelivery = max(0, freeDeliveryThreshold - itemTotal)
        self.freeDeliveryThreshold = freeDeliveryThreshold
    }

    /// The share of the free-delivery threshold reached, from 0 to 1.
    var freeDeliveryProgress: Double {
        guard freeDeliveryThreshold > 0 else { return 1 }
        return min(1, Double(itemTotal) / Double(freeDeliveryThreshold))
    }

    var hasFreeDelivery: Bool { amountToFreeDelivery == 0 }

    /// The cart bar floats on Home, Category and Search only when the cart has items.
    var showsCartBar: Bool { itemCount > 0 }
}

extension CartSummary {
    init(lines: [CartLine], catalog: any CatalogRepository) {
        var products: [String: Product] = [:]
        for line in lines {
            if let product = catalog.product(id: line.productId) { products[line.productId] = product }
        }
        self.init(lines: lines, products: products)
    }
}
