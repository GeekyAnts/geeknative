/// Screens that can be pushed onto the navigation stack. Names match spec/navigation.md.
/// The Task editor is a sheet, not a route.
enum Route: Hashable {
    case taskDetail(String)
    case settings
}
