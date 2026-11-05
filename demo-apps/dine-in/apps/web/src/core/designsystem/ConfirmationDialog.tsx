import { useId } from 'react'
import { AppDialog } from './AppDialog'
import { AppSerif } from './AppSerif'
import { PrimaryButton } from './PrimaryButton'
import { secondaryButtonClass } from './Buttons'

/** A native confirmation dialog with a (destructive) confirm button and a cancel button. */
export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
  confirmTestId,
  cancelTestId,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
  confirmTestId?: string
  cancelTestId?: string
}) {
  const titleId = useId()
  return (
    <AppDialog open={open} onClose={onCancel} labelledBy={titleId}>
      <div role="alertdialog" aria-labelledby={titleId} className="flex flex-col gap-lg rounded-xl bg-surface p-xl shadow-high">
        <div className="flex flex-col gap-sm">
          <AppSerif role="title" as="h2" id={titleId}>
            {title}
          </AppSerif>
          <p className="text-body text-on-surface-variant">{message}</p>
        </div>
        <div className="flex flex-col gap-sm">
          <PrimaryButton
            testId={confirmTestId}
            onClick={onConfirm}
            className={destructive ? 'bg-error text-on-error hover:bg-error' : ''}
          >
            {confirmLabel}
          </PrimaryButton>
          <button type="button" data-testid={cancelTestId} onClick={onCancel} className={secondaryButtonClass}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </AppDialog>
  )
}
