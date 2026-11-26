import { AppIcons } from '#/generated/icons'

/** An inline failure message (DESIGN.md: Transient failure message). */
export function AlertBanner({ message, testId }: { message: string; testId?: string }) {
  return (
    <p role="alert" data-testid={testId} className="flex items-center gap-sm rounded-lg bg-error p-md text-body text-on-error">
      <AppIcons.error aria-hidden className="size-icon-md shrink-0" />
      <span>{message}</span>
    </p>
  )
}
