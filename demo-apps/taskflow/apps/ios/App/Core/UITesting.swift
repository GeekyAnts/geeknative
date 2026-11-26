import Foundation

/// Launch arguments for XCUITests and showcase screenshots (spec/navigation.md, Screenshot launch).
///
/// - `-uiTesting`: in-memory repositories with `TaskSamples`, so UI tests never need the network.
/// - `-screenshotScreen tasks|task-detail|task-editor|settings`: open that screen on launch. The app
///   keeps the live server repository: a seeded backend runs during capture.
/// - `-screenshotAppearance light|dark`: force that appearance, without storing it.
/// - `-screenshotTaskId <id>`: the task that task-detail and task-editor open.
nonisolated struct LaunchOptions: Equatable {
    enum Screen: String {
        case tasks
        case taskDetail = "task-detail"
        case taskEditor = "task-editor"
        case settings
    }

    static let uiTestingFlag = "-uiTesting"
    static let screenFlag = "-screenshotScreen"
    static let appearanceFlag = "-screenshotAppearance"
    static let taskIdFlag = "-screenshotTaskId"

    var isUITesting = false
    var screen: Screen?
    var appearance: Appearance?
    var taskId: String?

    init(arguments: [String]) {
        func value(_ name: String) -> String? {
            guard let index = arguments.firstIndex(of: name), index + 1 < arguments.count else { return nil }
            return arguments[index + 1]
        }
        isUITesting = arguments.contains(Self.uiTestingFlag)
        screen = value(Self.screenFlag).flatMap(Screen.init(rawValue:))
        appearance = value(Self.appearanceFlag).flatMap(Appearance.init(rawValue:))
        taskId = value(Self.taskIdFlag)
    }

    static let current = LaunchOptions(arguments: ProcessInfo.processInfo.arguments)

    /// The navigation stack to start with: the screen's natural one, with Tasks underneath.
    @MainActor
    var initialPath: [Route] {
        switch screen {
        case .taskDetail, .taskEditor: taskId.map { [.taskDetail($0)] } ?? []
        case .settings: [.settings]
        case .tasks, nil: []
        }
    }

    /// Whether Task detail for `taskId` opens with the editor sheet presented.
    func presentsEditor(for taskId: String) -> Bool {
        screen == .taskEditor && self.taskId == taskId
    }
}

extension AppContainer {
    /// The container for this launch: live, or in-memory for `-uiTesting`. An appearance passed on
    /// the command line is kept in memory, so it never overwrites the user's stored choice.
    static func forLaunch(_ options: LaunchOptions) -> AppContainer {
        if options.isUITesting {
            return .preview(appearance: options.appearance ?? .system)
        }
        guard let appearance = options.appearance else { return .live() }
        return AppContainer(
            settingsRepository: InMemorySettingsRepository(appearance: appearance),
            tasksRepository: ApiTasksRepository()
        )
    }
}
