/// Screens that can be pushed onto the navigation stack. Names match spec/navigation.md.
/// Home (`home`) is the stack's root, so it has no case: an empty path is Home.
enum Route: Hashable {
    case category(categoryId: String)
    case search
    case cart
    case orderPlaced(orderId: String)
    case settings
}
