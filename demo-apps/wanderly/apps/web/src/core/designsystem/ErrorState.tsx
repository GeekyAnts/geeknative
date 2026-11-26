import { strings } from '#/generated/strings'
import { PrimaryButton } from './PrimaryButton'

export function ErrorState({
  title,
  body,
  testId,
  onRetry,
}: {
  title: string
  body: string
  testId: string
  onRetry?: () => void
}) {
  return (
    <div data-testid={testId} className="flex flex-col gap-md rounded-xl bg-surface p-lg shadow-low">
      <h1 className="text-headline">{title}</h1>
      <p className="text-body text-on-surface-variant">{body}</p>
      {onRetry ? <PrimaryButton onClick={onRetry}>{strings.commonRetry}</PrimaryButton> : null}
    </div>
  )
}
