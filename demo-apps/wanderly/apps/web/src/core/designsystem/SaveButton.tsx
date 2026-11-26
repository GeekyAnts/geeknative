import { AppIcons } from '#/generated/icons'
import { IconButton } from './IconButton'

export function SaveButton({
  saved,
  saveLabel,
  unsaveLabel,
  onToggle,
  testId,
  onPhoto = false,
}: {
  saved: boolean
  saveLabel: string
  unsaveLabel: string
  onToggle: () => void
  testId: string
  onPhoto?: boolean
}) {
  return (
    <IconButton
      label={saved ? unsaveLabel : saveLabel}
      data-testid={testId}
      onClick={onToggle}
      className={onPhoto ? 'bg-overlay/40 text-on-overlay' : 'text-on-surface-variant'}
    >
      <AppIcons.saved className={`size-icon-md ${saved ? 'fill-accent text-accent' : ''}`} />
    </IconButton>
  )
}
