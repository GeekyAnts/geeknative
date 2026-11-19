---
id: tasks
title: Tasks
status:
  ios: done
  android: done
  web: done
---

# Tasks

## Summary

The first screen. It lists the user's tasks from the Taskflow server, lets them filter by status and priority, mark a task done with one tap, and opens a task or the editor for a new one.

## User stories

- As someone planning my week, I want to see every open task with its priority and due date so I know what to work on next.
- As a busy user, I want to filter to "In progress" or "High" priority so I can focus.
- As a user who just finished something, I want to tick it off right from the list.

## Screens and states

**Tasks** (route `tasks`, web `/`), the app's start screen.

- Title: the app name (`AppIdentity.name`), leading-aligned.
- Actions: `tasks.add` (New task) and `tasks.openSettings` (gear icon, label from strings).
- Filters, above the list:
  - Status: a single choice of `tasks.filter.all`, `task.status.todo`, `task.status.inProgress`, `task.status.done`. Default All.
  - Priority: a menu labeled with the `filter` icon and the current choice, from `tasks.filter.anyPriority`, `task.priority.high`, `task.priority.medium`, `task.priority.low`. Default Any priority. Its accessibility label is `tasks.filter.priority`.
- A caption with the number of tasks shown: `tasks.count` (plural).
- The list. Each row is a card (`surface`, radius `lg`) showing:
  - A leading status toggle (48 touch target). Its icon is `statusTodo` or `statusInProgress` in `onSurfaceVariant`, or `statusDone` in `success`. Its accessibility label is `task.markDone` for an open task and `task.markTodo` for a done task.
  - The title (body). A done task's title is struck through and in `onSurfaceVariant`.
  - A metadata line (caption): the priority with the `priority` icon (High in `error`, Medium in `warning`, Low in `onSurfaceVariant`), the status label, and the due date if there is one, with the `dueDate` icon, as `task.due` with the date in the locale's medium style (for example "Due Nov 19, 2026"). An overdue task shows `task.overdue` before the date and both in `error`.
  - Tapping the row (anywhere except the toggle) opens Task detail.

States:

- **Loading** (first load, or after an error): a centered progress indicator labeled `common.loading`. When a later load is running (a filter change, coming back to the screen, pull to refresh) the current rows stay visible.
- **Error** (a load failed): the `error` icon, `tasks.error.title`, `tasks.error.body` and a `common.retry` button that loads again.
- **Empty** (no filters set and the server has no tasks): the `emptyTasks` icon, `tasks.empty.title`, `tasks.empty.body` and a `tasks.add` button.
- **Filtered empty** (a filter is set and nothing matches): `tasks.emptyFiltered.title`, `tasks.emptyFiltered.body` and a `tasks.clearFilters` button that resets both filters to All and Any priority.
- **Success**: the list in the order the server returns.

## Behavior and rules

- Data comes from `TasksRepository`, whose live implementation `ApiTasksRepository` calls the generated API client (`listTasks`, `updateTaskStatus`, and so on) against `AppConfig.apiBaseUrl`. No platform writes its own HTTP code.
- Filtering is done by the server: the status filter is sent as `status` and the priority filter as `priority` on `listTasks`; All and Any priority send nothing.
- Order is the server's: open tasks (To do, In progress) before Done, then High, Medium, Low, then the earliest due date (no due date last), then newest first. Clients don't re-sort.
- The status toggle sets an open task (To do or In progress) to `done`, and a Done task to `todo`, with `updateTaskStatus`. The row changes at once (optimistically). If the request fails, the row goes back to what it was and the user sees `tasks.updateError` (a snackbar on Android, an alert on iOS, an inline alert on web). If the task no longer matches the current filter after the change, it stays until the next load.
- Tasks loads again every time it becomes visible (coming back from Task detail or the editor), so changes made there show up.
- Filters are not saved: every launch starts at All and Any priority.
- A due date is a calendar date (`YYYY-MM-DD`). Parse it as a local date, never as UTC midnight, so it shows the same day in every time zone. A task is **overdue** when it isn't Done and its due date is before today's local date.

## Acceptance criteria

- AC-tasks-1 (ui): Tasks lists the server's tasks in the order received, each row showing its title, priority and status, and its due date when it has one.
- AC-tasks-2: While the first load runs a loading indicator shows; when a load fails, the error state shows, and Retry loads again and shows the tasks.
- AC-tasks-3: When there are no tasks and no filter is set, the empty state shows with a New task button.
- AC-tasks-4: Choosing a status filter requests only tasks with that status (`status` on `listTasks`) and shows them; All requests every status.
- AC-tasks-5: Choosing a priority filter requests only tasks with that priority (`priority` on `listTasks`), combined with the status filter.
- AC-tasks-6: When a filter matches nothing, the filtered-empty state shows, and Clear filters resets both filters and shows every task.
- AC-tasks-7 (ui): Tapping an open task's toggle marks it Done (and a Done task's toggle marks it To do) at once and saves it with `updateTaskStatus`.
- AC-tasks-8: When saving a toggle fails, the row returns to its previous status and `tasks.updateError` shows.
- AC-tasks-9: A task that isn't Done with a due date before today shows `task.overdue`; a Done task, or one due today or later, does not.
- AC-tasks-10 (ui): Tapping a row opens that task's Task detail, and New task opens the Task editor for a new task.
- AC-tasks-11 (ui): Tasks has an entry point that opens Settings.
- AC-tasks-12: The tasks count caption shows the number of tasks in the list.

## Copy

`tasks.*`, `task.status.*`, `task.priority.*`, `task.due`, `task.overdue`, `task.markDone`, `task.markTodo`, `common.loading`, `common.retry`.

## Platform notes

- iOS: `NavigationStack` with the app name as a large title. New task is a `+` toolbar button (the `add` icon, label `tasks.add`); the gear is a toolbar button. The status filter is a segmented `Picker`; the priority filter is a `Menu` with an inline `Picker`. Rows are in a `ScrollView` with `.refreshable` (pull to refresh). Toggle failures show an alert with `common.done`.
- Android: `Scaffold` with a `TopAppBar` (app name, gear action) and an `ExtendedFloatingActionButton` (`add` icon, `tasks.add`). The status filter is a `SingleChoiceSegmentedButtonRow`; the priority filter is a button with a `DropdownMenu`. Pull to refresh with `PullToRefreshBox`. Toggle failures show a `Snackbar`.
- Web: the site header holds the app name and the gear link. The page starts with an `h1` (app name) and a New task button (`bg-primary`). The status filter is a radio group drawn as a segmented control; the priority filter is a native `<select>`. The list loads in the browser (the server render shows the loading state) and reloads when the window regains focus instead of pull to refresh. Toggle failures show an inline `role="alert"` banner.

## Test IDs

- `tasks.list`: the list of rows.
- `tasks.row.<taskId>`: a task row.
- `tasks.row.<taskId>.toggle`: a row's status toggle.
- `tasks.addButton`: New task (the toolbar button, FAB or page button).
- `tasks.openSettings`: the Settings entry point.
- `tasks.statusFilter`: the status filter.
- `tasks.priorityFilter`: the priority filter.
- `tasks.count`: the tasks count caption.
- `tasks.loading`: the loading indicator.
- `tasks.error`: the error state.
- `tasks.retryButton`: Retry in the error state.
- `tasks.empty`: the empty state.
- `tasks.emptyAddButton`: New task in the empty state.
- `tasks.emptyFiltered`: the filtered-empty state.
- `tasks.clearFilters`: Clear filters.
- `tasks.updateError` (not on iOS): the toggle failure message. iOS shows a system alert, which carries no test ID.

## Assumptions and open questions

- Assumption: a single user, no sign-in. Accounts are out of scope for version one (PRODUCT.md).
- Assumption: the toggle on the list goes straight to Done (or back to To do). In progress is set from Task detail or the editor.
- Assumption: no search in version one; status and priority cover the filtering asked for.
- UI tests and previews use `InMemoryTasksRepository` with the sample data below, never the network. Each app starts with it when launched with the `-uiTesting` argument (iOS launch argument, Android intent extra `uiTesting=true`; web tests pass it through `testContainer`).

Sample data (`TaskSamples`, identical on every platform; dates are relative to the injected "today"):

| id | title | status | priority | due |
|---|---|---|---|---|
| `sample-1` | Finalize Q4 product roadmap | inProgress | high | today + 1 |
| `sample-2` | Fix crash when uploading large attachments | todo | high | today − 1 (overdue) |
| `sample-3` | Prepare slides for the all-hands | todo | medium | today + 3 |
| `sample-4` | Renew the SSL certificate for staging | done | low | none |

Every sample has empty notes, and `createdAt` and `updatedAt` set to the injected "now". `InMemoryTasksRepository` filters and sorts exactly like the server, so its list order is sample-2, sample-1, sample-3, sample-4.
