import { strings } from '#/generated/strings'

/** A centered spinner labeled "Loading" (DESIGN.md: Loading). */
export function LoadingIndicator({ testId }: { testId?: string }) {
  return (
    <div role="status" data-testid={testId} className="flex justify-center py-xxl">
      <span aria-hidden className="size-icon-lg rounded-full border-4 border-surface-variant border-t-primary motion-safe:animate-spin" />
      <span className="sr-only">{strings.commonLoading}</span>
    </div>
  )
}
