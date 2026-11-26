import Foundation

/// Launch arguments that open a named screen for screenshot capture.
///
/// `-screenshotScreen`, `-screenshotAppearance`, `-screenshotCategoryId`, `-screenshotOrderId`.
enum ScreenshotLaunch {
    static let screenFlag = "-screenshotScreen"
    static let appearanceFlag = "-screenshotAppearance"
    static let categoryFlag = "-screenshotCategoryId"
    static let orderFlag = "-screenshotOrderId"

    static let categoryId = "fruits"
    static let orderId = "MN123456"
    /// 1761800123456 % 1_000_000 is 123456, so the order id is MN123456.
    static let placedAt = 1_761_800_123_456

    static var isCapturing: Bool {
        ProcessInfo.processInfo.arguments.contains(screenFlag)
    }

    static func argument(_ flag: String) -> String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: flag), index + 1 < arguments.count else { return nil }
        return arguments[index + 1]
    }

    static func path() -> [Route] {
        let category = argument(categoryFlag) ?? categoryId
        let order = argument(orderFlag) ?? orderId
        switch argument(screenFlag) {
        case "category": return [.category(categoryId: category)]
        case "search": return [.search]
        case "cart": return [.cart]
        case "order-placed": return [.orderPlaced(orderId: order)]
        case "settings": return [.settings]
        default: return []
        }
    }

    static func appearance() -> Appearance {
        argument(appearanceFlag).flatMap(Appearance.init(rawValue:)) ?? .system
    }

    /// Bananas and milk, the same cart the web shots store under `cart.items`.
    static func cartLines() -> [CartLine] {
        [CartLine(productId: "banana", quantity: 2), CartLine(productId: "milk", quantity: 1)]
    }

    static func order() -> Order {
        Order(
            id: argument(orderFlag) ?? orderId,
            placedAt: placedAt,
            lines: [
                OrderLine(productId: "banana", name: "Robusta Banana", unit: "6 pcs", emoji: "🍌", categoryId: "fruits", price: 49, mrp: 60, quantity: 2),
                OrderLine(productId: "milk", name: "Toned Milk", unit: "500 ml", emoji: "🥛", categoryId: "dairy", price: 28, mrp: 28, quantity: 1),
            ],
            itemCount: 3,
            itemTotal: 126,
            savings: 22,
            deliveryFee: 25,
            toPay: 151
        )
    }
}
