import { useId } from 'react'
import { AlertBanner } from '#/core/designsystem/AlertBanner'
import { AppCard } from '#/core/designsystem/AppCard'
import { LoadingIndicator } from '#/core/designsystem/LoadingIndicator'
import { Page } from '#/core/designsystem/Page'
import { SegmentedControl } from '#/core/designsystem/SegmentedControl'
import { StateMessage } from '#/core/designsystem/StateMessage'
import { primaryButton, secondaryButton } from '#/core/designsystem/buttons'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useTaskEditorViewModel, type TaskDraft } from './useTaskEditorViewModel'

const fieldClass =
  'w-full rounded-md border border-outline bg-background px-md py-sm text-body text-on-background placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-primary aria-invalid:border-error disabled:opacity-60'

export function TaskEditorScreen({ taskId }: { taskId?: string }) {
  const viewModel = useTaskEditorViewModel(taskId)
  const { state } = viewModel

  return (
    <Page>
      <h1 className="text-display">{viewModel.title}</h1>

      {state.kind === 'loading' && <LoadingIndicator testId="taskEditor.loading" />}

      {state.kind === 'error' && (
        <StateMessage
          testId="taskEditor.error"
          icon={<AppIcons.error className="size-icon-lg text-error" />}
          title={strings.taskDetailErrorTitle}
          action={
            <button type="button" onClick={viewModel.retry} data-testid="taskEditor.retryButton" className={secondaryButton}>
              <AppIcons.retry aria-hidden className="size-icon-md" />
              <span>{strings.commonRetry}</span>
            </button>
          }
        />
      )}

      {state.kind === 'editing' && (
        <>
          {viewModel.saveError && <AlertBanner message={viewModel.saveError} testId="taskEditor.saveError" />}
          <TaskForm draft={state.draft} viewModel={viewModel} />
        </>
      )}
    </Page>
  )
}

function TaskForm({ draft, viewModel }: { draft: TaskDraft; viewModel: ReturnType<typeof useTaskEditorViewModel> }) {
  const id = useId()

  return (
    <AppCard>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void viewModel.save()
        }}
      >
        <fieldset disabled={viewModel.saving} className="flex flex-col gap-xl">
          <div className="flex flex-col gap-sm">
            <label htmlFor={`${id}-title`} className="text-label text-on-surface-variant">
              {strings.taskEditorTitleLabel}
            </label>
            <input
              id={`${id}-title`}
              type="text"
              autoFocus={viewModel.isNew}
              value={draft.title}
              onChange={(event) => viewModel.setTitle(event.target.value)}
              placeholder={strings.taskEditorTitlePlaceholder}
              aria-invalid={viewModel.titleError !== null}
              aria-describedby={viewModel.titleError ? `${id}-title-error` : undefined}
              data-testid="taskEditor.titleField"
              className={`${fieldClass} min-h-touch-target`}
            />
            {viewModel.titleError && (
              <p id={`${id}-title-error`} data-testid="taskEditor.titleError" className="text-caption text-error">
                {viewModel.titleError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-sm">
            <label htmlFor={`${id}-notes`} className="text-label text-on-surface-variant">
              {strings.taskEditorNotesLabel}
            </label>
            <textarea
              id={`${id}-notes`}
              rows={4}
              value={draft.notes}
              onChange={(event) => viewModel.setNotes(event.target.value)}
              placeholder={strings.taskEditorNotesPlaceholder}
              aria-invalid={viewModel.notesError !== null}
              aria-describedby={viewModel.notesError ? `${id}-notes-error` : undefined}
              data-testid="taskEditor.notesField"
              className={`${fieldClass} resize-y`}
            />
            {viewModel.notesError && (
              <p id={`${id}-notes-error`} data-testid="taskEditor.notesError" className="text-caption text-error">
                {viewModel.notesError}
              </p>
            )}
          </div>

          <SegmentedControl
            label={strings.taskEditorStatusLabel}
            showLabel
            options={viewModel.statusOptions}
            value={draft.status}
            onChange={viewModel.setStatus}
            disabled={viewModel.saving}
            testId="taskEditor.status"
          />

          <SegmentedControl
            label={strings.taskEditorPriorityLabel}
            showLabel
            options={viewModel.priorityOptions}
            value={draft.priority}
            onChange={viewModel.setPriority}
            disabled={viewModel.saving}
            testId="taskEditor.priority"
          />

          <div className="flex flex-col gap-md">
            <label className="flex min-h-touch-target cursor-pointer items-center justify-between gap-md">
              <span className="text-body">{strings.taskEditorHasDueDate}</span>
              <input
                type="checkbox"
                role="switch"
                checked={draft.hasDueDate}
                onChange={(event) => viewModel.setHasDueDate(event.target.checked)}
                data-testid="taskEditor.dueDateToggle"
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative inline-flex h-xl w-(--spacing-touch-target) shrink-0 items-center rounded-full bg-outline peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-checked:[&>span]:translate-x-xl motion-safe:transition duration-fast ease-standard"
              >
                <span className="ml-xs size-lg rounded-full bg-background shadow-low motion-safe:transition ease-snappy duration-snappy" />
              </span>
            </label>
            {draft.hasDueDate && (
              <div className="flex flex-col gap-sm">
                <label htmlFor={`${id}-due`} className="text-label text-on-surface-variant">
                  {strings.taskEditorDueDateLabel}
                </label>
                <input
                  id={`${id}-due`}
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) => viewModel.setDueDate(event.target.value)}
                  data-testid="taskEditor.dueDate"
                  className={`${fieldClass} min-h-touch-target`}
                />
              </div>
            )}
          </div>
        </fieldset>

        <div className="mt-xl flex flex-wrap justify-end gap-sm">
          <button type="button" onClick={viewModel.cancel} data-testid="taskEditor.cancelButton" className={secondaryButton}>
            {strings.commonCancel}
          </button>
          <button type="submit" disabled={!viewModel.canSave || viewModel.saving} data-testid="taskEditor.saveButton" className={primaryButton}>
            {viewModel.saving && (
              <span aria-hidden className="size-icon-sm rounded-full border-2 border-on-primary/40 border-t-on-primary motion-safe:animate-spin" />
            )}
            <span>{strings.commonSave}</span>
          </button>
        </div>
      </form>
    </AppCard>
  )
}
