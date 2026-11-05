import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { EmptyState } from './EmptyState'

/** `EmptyState` with the alert icon and a retry button. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <EmptyState icon={AppIcons.alert} title={strings.commonErrorTitle} body={strings.commonErrorBody} action={strings.commonRetry} onAction={onRetry} />
}
