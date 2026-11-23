import SwiftUI

/// A group of products, such as Fruits & Vegetables (PRODUCT.md, Glossary).
nonisolated struct Category: Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let emoji: String
}

/// Something the customer can buy. Prices are whole rupees.
nonisolated struct Product: Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let unit: String
    let price: Int
    let mrp: Int
    let emoji: String
    let categoryId: String
    let isBestseller: Bool

    /// `(mrp - price) * 100 / mrp`, rounded down. 0 means no badge and no struck-through MRP.
    var discountPercent: Int {
        guard mrp > price, mrp > 0 else { return 0 }
        return (mrp - price) * 100 / mrp
    }

    var hasDiscount: Bool { discountPercent > 0 }
}

/// The pastel tile behind a category's artwork: the token `tile<Id>` (DESIGN.md, Color roles).
nonisolated enum CategoryTint {
    static func color(for categoryId: String) -> Color {
        switch categoryId {
        case "fruits": AppColors.tileFruits
        case "dairy": AppColors.tileDairy
        case "snacks": AppColors.tileSnacks
        case "drinks": AppColors.tileDrinks
        case "household": AppColors.tileHousehold
        case "personal": AppColors.tilePersonal
        default: AppColors.surfaceVariant
        }
    }
}
