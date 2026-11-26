import { Link } from '@tanstack/react-router'
import { useRef } from 'react'
import { AlertBanner } from '#/core/designsystem/AlertBanner'
import { AppCard } from '#/core/designsystem/AppCard'
import { LoadingIndicator } from '#/core/designsystem/LoadingIndicator'
import { Page } from '#/core/designsystem/Page'
import { SegmentedControl } from '#/core/designsystem/SegmentedControl'
import { StateMessage } from '#/core/designsystem/StateMessage'
import { destructiveButton, destructiveFilledButton, secondaryButton } from '#/core/designsystem/buttons'
import { formatDateTime, formatLongDate, isOverdue } from '#/features/tasks/TaskDates'
import { DueDateText, PriorityLabel } from '#/features/tasks/TaskLabels'
import type { TaskItem } from '#/features/tasks/Task'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useTaskDetailViewModel } from './useTaskDetailViewModel'

export function TaskDetailScreen({ taskId }: { taskId: string }) {
  const viewModel = useTaskDetailViewModel(taskId)
  const { state } = viewModel

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-display">{strings.taskDetailTitle}</h1>
        {state.kind === 'loaded' && (
          <Link to="/tasks/$taskId/edit" params={{ taskId }} data-testid="taskDetail.editButton" className={secondaryButton}>
            <AppIcons.edit aria-hidden className="size-icon-md" />
            <span>{strings.taskDetailEdit}</span>
          </Link>
        )}
      </div>

      {viewModel.message && <AlertBanner message={viewModel.message} testId="taskDetail.message" />}

      {state.kind === 'loading' && <LoadingIndicator testId="taskDetail.loading" />}

      {state.kind === 'error' && (
        <StateMessage
          testId="taskDetail.error"
          icon={<AppIcons.error className="size-icon-lg text-error" />}
          title={strings.taskDetailErrorTitle}
          body={strings.taskDetailErrorBody}
          action={
            <button type="button" onClick={viewModel.retry} data-testid="taskDetail.retryButton" className={secondaryButton}>
              <AppIcons.retry aria-hidden className="size-icon-md" />
              <span>{strings.commonRetry}</span>
            </button>
          }
        />
      )}

      {state.kind === 'notFound' && (
        <StateMessage
          testId="taskDetail.notFound"
          icon={<AppIcons.emptyTasks className="size-icon-lg" />}
          title={strings.taskDetailNotFoundTitle}
          body={strings.taskDetailNotFoundBody}
        />
      )}

      {state.kind === 'loaded' && <TaskDetails task={state.task} viewModel={viewModel} />}
    </Page>
  )
}

function TaskDetails({ task, viewModel }: { task: TaskItem; viewModel: ReturnType<typeof useTaskDetailViewModel> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const overdue = isOverdue(task)

  return (
    <>
      <h2 data-testid="taskDetail.taskTitle" className="text-headline break-words">
        {task.title}
      </h2>

      <SegmentedControl
        label={strings.taskDetailStatus}
        showLabel
        options={viewModel.statusOptions}
        value={task.status}
        onChange={(status) => void viewModel.selectStatus(task, status)}
        disabled={viewModel.busy}
        testId="taskDetail.status"
      />

      <AppCard className="flex flex-col divide-y divide-outline py-0">
        <div className="flex min-h-touch-target items-center justify-between gap-md py-md">
          <span className="text-body">{strings.taskDetailPriority}</span>
          <span className="text-body">
            <PriorityLabel priority={task.priority} testId="taskDetail.priority" />
          </span>
        </div>
        <div className="flex min-h-touch-target items-center justify-between gap-md py-md">
          <span className="text-body">{strings.taskDetailDueDate}</span>
          <span data-testid="taskDetail.dueDate" className="text-body text-on-surface-variant">
            {task.dueDate ? <DueDateText text={formatLongDate(task.dueDate)} overdue={overdue} /> : strings.taskDetailNoDueDate}
          </span>
        </div>
      </AppCard>

      <section className="flex flex-col gap-sm">
        <h3 className="text-label text-on-surface-variant">{strings.taskDetailNotes}</h3>
        <p data-testid="taskDetail.notes" className={`text-body break-words whitespace-pre-wrap ${task.notes ? '' : 'text-on-surface-variant'}`}>
          {task.notes || strings.taskDetailNoNotes}
        </p>
      </section>

      <div className="flex flex-col gap-xs text-caption text-on-surface-variant">
        <p data-testid="taskDetail.created">{strings.taskDetailCreated({ date: formatDateTime(task.createdAt) })}</p>
        <p data-testid="taskDetail.updated">{strings.taskDetailUpdated({ date: formatDateTime(task.updatedAt) })}</p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => dialog.current?.showModal()}
          disabled={viewModel.busy}
          data-testid="taskDetail.deleteButton"
          className={destructiveButton}
        >
          <AppIcons.trash aria-hidden className="size-icon-md" />
          <span>{strings.taskDetailDelete}</span>
        </button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="delete-task-title"
        className="m-auto w-full max-w-sm rounded-lg bg-surface p-xl text-on-surface shadow-high backdrop:bg-on-background/40"
      >
        <h2 id="delete-task-title" className="text-title">
          {strings.taskDetailDeleteConfirmTitle}
        </h2>
        <p className="mt-sm text-body text-on-surface-variant">{strings.taskDetailDeleteConfirmMessage}</p>
        <div className="mt-xl flex flex-wrap justify-end gap-sm">
          <button type="button" autoFocus onClick={() => dialog.current?.close()} className={secondaryButton}>
            {strings.commonCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              dialog.current?.close()
              void viewModel.deleteTask()
            }}
            data-testid="taskDetail.confirmDelete"
            className={destructiveFilledButton}
          >
            {strings.taskDetailDeleteConfirmAction}
          </button>
        </div>
      </dialog>
    </>
  )
}
