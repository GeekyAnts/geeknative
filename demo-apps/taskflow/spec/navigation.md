# Navigation

The app's screens, their route names, and how each platform presents them. Route names are the same in every app: `Route.taskDetail(taskId)` on iOS, `Route.TaskDetail(taskId)` on Android and `/tasks/$taskId` on web.

| Screen | Route | Web path | Reached from |
|---|---|---|---|
| Tasks | `tasks` | `/` | App start |
| Task detail | `taskDetail(taskId)` | `/tasks/$taskId` | A row on Tasks |
| Task editor (new) | `taskEditor(nil)` | `/tasks/new` | New task on Tasks (toolbar, FAB, page button, or the empty state) |
| Task editor (edit) | `taskEditor(taskId)` | `/tasks/$taskId/edit` | Edit on Task detail |
| Settings | `settings` | `/settings` | The gear on Tasks |

After saving a new task the editor returns to Tasks; after saving an edit it returns to Task detail. After deleting, Task detail returns to Tasks.

## Per platform

- **iOS:** one `NavigationStack` rooted at Tasks. Task detail and Settings are pushed by appending a `Route` (apps/ios/App/Core/Navigation/Route.swift). The Task editor is a sheet with its own `NavigationStack`, the iOS convention for create and edit forms.
- **Android:** one Navigation 3 back stack starting at `Route.Tasks`. Every screen, the editor included, is pushed with `backStack.add(...)` (apps/android/.../core/navigation).
- **Web:** TanStack Router file routes in apps/web/src/routes. Every screen has a URL.

## Screenshot launch

For the showcase (previews/shots.json), iOS and Android open a screen directly from launch arguments: `-screenshotScreen` (`tasks`, `task-detail`, `task-editor`, `settings`), `-screenshotAppearance` (`light`, `dark`) and `-screenshotTaskId` for the task screens. Android reads the same names as string intent extras. The back stack is the screen's natural one (Tasks underneath). Web uses the paths above.

When you add a screen, add a row here. Use the web path as the mobile deep link path when deep links are added.
