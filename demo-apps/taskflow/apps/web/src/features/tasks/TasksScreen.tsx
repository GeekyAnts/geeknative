import { Link } from '@tanstack/react-router'
import { AlertBanner } from '#/core/designsystem/AlertBanner'
import { LoadingIndicator } from '#/core/designsystem/LoadingIndicator'
import { Page } from '#/core/designsystem/Page'
import { SegmentedControl } from '#/core/designsystem/SegmentedControl'
import { StateMessage } from '#/core/designsystem/StateMessage'
import { primaryButton, secondaryButton } from '#/core/designsystem/buttons'
import { AppIdentity } from '#/generated/app'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { statusLabel, type TaskItem } from './Task'
import { formatMediumDate, isOverdue } from './TaskDates'
import { DueDateText, PriorityLabel, StatusIcon } from './TaskLabels'
import { useTasksViewModel, type PriorityChoice } from './useTasksViewModel'

export function TasksScreen() {
  const viewModel = useTasksViewModel()
  const { state } = viewModel

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-display">{AppIdentity.name}</h1>
        <Link to="/tasks/new" data-testid="tasks.addButton" className={primaryButton}>
          <AppIcons.add aria-hidden className="size-icon-md" />
          <span>{strings.tasksAdd}</span>
        </Link>
      </div>

      <div className="flex flex-col gap-md sm:flex-row sm:items-end">
        <div className="flex-1">
          <SegmentedControl
            label={strings.tasksFilterStatus}
            options={viewModel.statusOptions}
            value={viewModel.status}
            onChange={viewModel.selectStatus}
            testId="tasks.statusFilter"
          />
        </div>
        <label className="relative flex min-h-touch-target items-center gap-sm rounded-lg border border-outline px-md text-label has-focus-visible:outline-2 has-focus-visible:outline-primary">
          <AppIcons.filter aria-hidden className="size-icon-sm text-on-surface-variant" />
          <select
            aria-label={strings.tasksFilterPriority}
            data-testid="tasks.priorityFilter"
            value={viewModel.priority}
            onChange={(event) => viewModel.selectPriority(event.target.value as PriorityChoice)}
            className="min-h-touch-target cursor-pointer bg-transparent text-label outline-none"
          >
            {viewModel.priorityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {viewModel.updateError && <AlertBanner message={viewModel.updateError} testId="tasks.updateError" />}

      {state.kind === 'loading' && <LoadingIndicator testId="tasks.loading" />}

      {state.kind === 'error' && (
        <StateMessage
          testId="tasks.error"
          icon={<AppIcons.error className="size-icon-lg text-error" />}
          title={strings.tasksErrorTitle}
          body={strings.tasksErrorBody}
          action={
            <button type="button" onClick={viewModel.retry} data-testid="tasks.retryButton" className={secondaryButton}>
              <AppIcons.retry aria-hidden className="size-icon-md" />
              <span>{strings.commonRetry}</span>
            </button>
          }
        />
      )}

      {state.kind === 'empty' && (
        <StateMessage
          testId="tasks.empty"
          icon={<AppIcons.emptyTasks className="size-icon-lg" />}
          title={strings.tasksEmptyTitle}
          body={strings.tasksEmptyBody}
          action={
            <Link to="/tasks/new" data-testid="tasks.emptyAddButton" className={primaryButton}>
              <AppIcons.add aria-hidden className="size-icon-md" />
              <span>{strings.tasksAdd}</span>
            </Link>
          }
        />
      )}

      {state.kind === 'emptyFiltered' && (
        <StateMessage
          testId="tasks.emptyFiltered"
          icon={<AppIcons.filter className="size-icon-lg" />}
          title={strings.tasksEmptyFilteredTitle}
          body={strings.tasksEmptyFilteredBody}
          action={
            <button type="button" onClick={viewModel.clearFilters} data-testid="tasks.clearFilters" className={secondaryButton}>
              {strings.tasksClearFilters}
            </button>
          }
        />
      )}

      {state.kind === 'list' && (
        <div className="flex flex-col gap-sm">
          <p data-testid="tasks.count" className="text-caption text-on-surface-variant">
            {viewModel.countText}
          </p>
          <ul data-testid="tasks.list" className="flex flex-col gap-sm">
            {state.tasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={() => void viewModel.toggle(task)} />
            ))}
          </ul>
        </div>
      )}
    </Page>
  )
}

function TaskRow({ task, onToggle }: { task: TaskItem; onToggle: () => void }) {
  const done = task.status === 'done'

  return (
    <li
      data-testid={`tasks.row.${task.id}`}
      className="relative flex items-center gap-xs rounded-lg bg-surface py-sm pr-lg pl-xs text-on-surface has-[a:hover]:bg-surface-variant has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-primary"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? strings.taskMarkTodo : strings.taskMarkDone}
        data-testid={`tasks.row.${task.id}.toggle`}
        className="relative z-10 inline-flex size-touch-target shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-primary"
      >
        <StatusIcon status={task.status} className="size-icon-md" />
      </button>
      {/* The link covers the whole card, so tapping anywhere but the toggle opens the task. */}
      <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="flex min-w-0 flex-1 flex-col gap-xs outline-none after:absolute after:inset-0 after:rounded-lg">
        <span className={`text-body ${done ? 'text-on-surface-variant line-through' : ''}`}>{task.title}</span>
        <span className="flex flex-wrap items-center gap-x-md gap-y-xs text-caption text-on-surface-variant">
          <PriorityLabel priority={task.priority} />
          <span>{statusLabel(task.status)}</span>
          {task.dueDate && <DueDateText text={strings.taskDue({ date: formatMediumDate(task.dueDate) })} overdue={isOverdue(task)} />}
        </span>
      </Link>
    </li>
  )
}
