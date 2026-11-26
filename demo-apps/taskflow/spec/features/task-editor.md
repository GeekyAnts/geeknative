---
id: task-editor
title: Task editor
status:
  ios: done
  android: done
  web: done
---

# Task editor

## Summary

One form to create a task or edit an existing one: title, notes, status, priority and an optional due date.

## User stories

- As a user, I want to capture a task in a few seconds with sensible defaults.
- As a user, I want to change a task's priority or due date when plans change.

## Screens and states

**Task editor** (route `taskEditor(taskId?)`; web `/tasks/new` for a new task and `/tasks/$taskId/edit` to edit). Opened from Tasks (new) and Task detail (edit).

- Title: `taskEditor.newTitle` or `taskEditor.editTitle`, leading-aligned.
- Actions: `common.cancel` and `common.save`.
- Fields, in this order:
  - `taskEditor.titleLabel`: single line, placeholder `taskEditor.titlePlaceholder`. Focused when creating a new task.
  - `taskEditor.notesLabel`: multi-line, placeholder `taskEditor.notesPlaceholder`.
  - `taskEditor.statusLabel`: a single choice of the three statuses.
  - `taskEditor.priorityLabel`: a single choice of `task.priority.low`, `task.priority.medium`, `task.priority.high`.
  - `taskEditor.hasDueDate`: a switch. When on, a `taskEditor.dueDateLabel` date picker appears below it.
- Validation messages appear under their field in `error`.

States:

- **Loading** (edit only, while the task loads with `getTask`): a progress indicator labeled `common.loading`. A failed load shows `taskDetail.error.title` with `common.retry`.
- **Editing**: the form.
- **Saving**: Save is disabled and shows a progress indicator; fields are disabled.
- **Save failed**: `taskEditor.saveError` above the form; every field keeps what the user typed, and Save is enabled again.

## Behavior and rules

- A new task starts with an empty title and notes, status To do, priority Medium and no due date.
- Editing starts with the task's current values.
- Title: trimmed before saving; required; at most 120 characters. Save is disabled while the trimmed title is empty or longer than 120. `taskEditor.titleRequired` shows once the user has typed in the field and left it empty; `taskEditor.titleTooLong` shows while it's too long.
- Notes: optional, at most 2000 characters (`taskEditor.notesTooLong`, Save disabled). Saved as typed, with surrounding whitespace trimmed; empty means no notes.
- Due date: turning the switch on picks today's date (local) unless a date was already chosen. Turning it off sends no `dueDate`, which clears it. Dates are sent as `YYYY-MM-DD` from the local calendar date.
- Saving a new task calls `createTask` with a `TaskInput`; on success the editor closes and Tasks shows the new task.
- Saving an edit calls `updateTask` (a full replacement) with a `TaskInput`; on success the editor closes and Task detail shows the changes.
- Cancel closes the editor without saving and without asking.

## Acceptance criteria

- AC-task-editor-1 (ui): New task opens the editor with an empty title, status To do, priority Medium and no due date.
- AC-task-editor-2: Save is disabled while the trimmed title is empty or over 120 characters, or notes are over 2000, and the matching message shows.
- AC-task-editor-3: Saving a new task sends the trimmed title, notes, status, priority and due date with `createTask`, then closes the editor.
- AC-task-editor-4: Editing an existing task starts with its values, and saving sends the changes with `updateTask` and closes the editor.
- AC-task-editor-5: Turning the due date on picks today's date; turning it off saves the task without a due date.
- AC-task-editor-6: While saving, Save is disabled; when saving fails, `taskEditor.saveError` shows and every field keeps its value.
- AC-task-editor-7 (ui): Cancel closes the editor without saving.

## Copy

`taskEditor.*`, `task.status.*`, `task.priority.*`, `common.cancel`, `common.save`, `common.done`, `common.loading`, `common.retry`, `taskDetail.error.title`.

## Platform notes

- iOS: presented as a sheet with its own `NavigationStack` (large title), a `Form` on `background` with `surface` rows. Cancel and Save are toolbar buttons (cancellation and confirmation placements). Status and priority are segmented `Picker`s; the due date is a `Toggle` and a compact `DatePicker`.
- Android: pushed onto the back stack as a full screen. The `TopAppBar` has a close button (`close` icon, label `common.cancel`) and a Save text button. Status and priority are `SingleChoiceSegmentedButtonRow`s; the due date is a `Switch` row and a row that opens a `DatePickerDialog` with `common.done` and `common.cancel`.
- Web: its own page with the form in a card. Save (`bg-primary`) and Cancel buttons at the bottom of the form. Status and priority are radio groups drawn as segmented controls; the due date is a checkbox styled as a switch and an `<input type="date">`.

## Test IDs

- `taskEditor.titleField`: the title field.
- `taskEditor.titleError`: the title's validation message.
- `taskEditor.notesField`: the notes field.
- `taskEditor.notesError`: the notes' validation message.
- `taskEditor.status`: the status choice.
- `taskEditor.priority`: the priority choice.
- `taskEditor.dueDateToggle`: the due date switch.
- `taskEditor.dueDate`: the date picker.
- `taskEditor.saveButton`: Save.
- `taskEditor.cancelButton`: Cancel.
- `taskEditor.saveError`: the save failure message.
- `taskEditor.loading`: the loading indicator.
- `taskEditor.error`, `taskEditor.retryButton`: the load failure state and its Retry (edit only).

## Assumptions and open questions

- Assumption: no "discard changes?" prompt on Cancel in version one.
