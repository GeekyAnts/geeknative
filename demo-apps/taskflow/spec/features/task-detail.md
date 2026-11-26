---
id: task-detail
title: Task detail
status:
  ios: done
  android: done
  web: done
---

# Task detail

## Summary

Shows everything about one task, lets the user change its status in one tap, edit it, or delete it.

## User stories

- As a user, I want to read a task's notes and dates before I start on it.
- As a user, I want to move a task to In progress without opening a form.
- As a user, I want to delete a task I no longer need, without deleting one by accident.

## Screens and states

**Task detail** (route `taskDetail(taskId)`, web `/tasks/$taskId`), pushed from Tasks.

- Title: `taskDetail.title`, leading-aligned.
- Actions: `taskDetail.edit`, which opens the Task editor for this task.
- Content, top to bottom:
  - The task's title (headline).
  - Status: a single choice of `task.status.todo`, `task.status.inProgress`, `task.status.done`, labeled `taskDetail.status`. The current status is selected.
  - A card with two rows: `taskDetail.priority` with the priority (the `priority` icon and color as on Tasks), and `taskDetail.dueDate` with the due date in the locale's long style, or `taskDetail.noDueDate`. An overdue date shows `task.overdue` and is in `error`.
  - `taskDetail.notes` with the notes, or `taskDetail.noNotes` in `onSurfaceVariant`.
  - Two captions: `taskDetail.created` and `taskDetail.updated`, with date and time in the locale's medium date and short time styles.
  - A destructive `taskDetail.delete` button (`trash` icon, `error` color).

States:

- **Loading**: a centered progress indicator labeled `common.loading`.
- **Error**: the `error` icon, `taskDetail.error.title`, `taskDetail.error.body` and `common.retry`.
- **Not found** (the server answers 404): `taskDetail.notFound.title` and `taskDetail.notFound.body`. The user goes back with the platform's back.
- **Success**: the content above.

## Behavior and rules

- The task is loaded with `getTask` every time the screen becomes visible, so it shows edits made in the editor.
- Choosing a status saves it at once with `updateTaskStatus`. The control changes immediately; on failure it goes back to the previous status and `taskDetail.updateError` shows. On success the screen shows the task the server returned (including the new `updatedAt`).
- Delete asks first: a confirmation with `taskDetail.deleteConfirm.title`, `taskDetail.deleteConfirm.message`, a destructive `taskDetail.deleteConfirm.action` and `common.cancel`. Confirming calls `deleteTask` and, on success, returns to Tasks, which no longer lists the task. On failure the user stays on the screen and sees `taskDetail.deleteError`. Cancelling changes nothing.
- While a status change or delete is in flight, the status control and the delete button are disabled.

## Acceptance criteria

- AC-task-detail-1 (ui): Task detail shows the task's title, status, priority, due date (or `taskDetail.noDueDate`), notes (or `taskDetail.noNotes`), and created and updated dates.
- AC-task-detail-2: Choosing a status saves it with `updateTaskStatus` and shows the returned task; on failure the previous status comes back and `taskDetail.updateError` shows.
- AC-task-detail-3 (ui): Delete asks for confirmation; confirming deletes the task with `deleteTask` and returns to Tasks without it, and cancelling keeps it.
- AC-task-detail-4: While loading a progress indicator shows; a failed load shows the error state with Retry, and a 404 shows the not-found state.
- AC-task-detail-5 (ui): Edit opens the Task editor filled in with this task.
- AC-task-detail-6: When deleting fails, the user stays on Task detail and `taskDetail.deleteError` shows.

## Copy

`taskDetail.*`, `task.status.*`, `task.priority.*`, `task.overdue`, `common.cancel`, `common.loading`, `common.retry`.

## Platform notes

- iOS: pushed onto the `NavigationStack`, large title. Edit is a toolbar text button. The status is a segmented `Picker`. The delete confirmation is a `.confirmationDialog`. Failures show an alert with `common.done`.
- Android: pushed onto the back stack. The `TopAppBar` has a back button (`common.back`) and an edit icon action (`edit` icon, label `taskDetail.edit`). The status is a `SingleChoiceSegmentedButtonRow`. The confirmation is an `AlertDialog`. Failures show a `Snackbar`.
- Web: its own page. An Edit link sits next to the `h1`. The status is a radio group drawn as a segmented control. The confirmation is a native `<dialog>`. Failures show an inline `role="alert"` banner.

## Test IDs

- `taskDetail.taskTitle`: the task's title.
- `taskDetail.status`: the status control.
- `taskDetail.priority`: the priority value.
- `taskDetail.dueDate`: the due date value.
- `taskDetail.notes`: the notes text.
- `taskDetail.created`, `taskDetail.updated`: the dates.
- `taskDetail.editButton`: Edit.
- `taskDetail.deleteButton`: Delete task.
- `taskDetail.confirmDelete`: the confirmation's Delete action.
- `taskDetail.loading`: the loading indicator.
- `taskDetail.error`: the error state.
- `taskDetail.retryButton`: Retry in the error state.
- `taskDetail.notFound`: the not-found state.
- `taskDetail.message` (not on iOS): the failure message. iOS shows a system alert, which carries no test ID.

## Assumptions and open questions

- Assumption: no undo after delete; the confirmation is the safeguard.
