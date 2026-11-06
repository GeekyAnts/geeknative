import { useEffect, useRef, useState, type FormEvent } from 'react'
import { PrimaryButton, SecondaryButton } from './Buttons'
import { strings } from '#/generated/strings'

export type EnquiryDraft = {
  coupleName: string
  email: string
  date: string
  guests: string
  message: string
}

const emptyDraft: EnquiryDraft = { coupleName: '', email: '', date: '', guests: '', message: '' }

export function isValidEnquiry(draft: EnquiryDraft) {
  return draft.coupleName.trim().length > 0 && draft.email.includes('@') && draft.message.trim().length > 0
}

export function EnquireDialog({
  title,
  successMessage,
  open,
  success,
  onClose,
  onSubmit,
  testId = 'venues.enquireForm',
  submitTestId = 'venues.enquireSubmit',
  successTestId = 'venues.enquireSuccess',
}: {
  title: string
  successMessage: string
  open: boolean
  success: boolean
  onClose: () => void
  onSubmit: (draft: EnquiryDraft) => void
  testId?: string
  submitTestId?: string
  successTestId?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [error, setError] = useState(false)

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!isValidEnquiry(draft)) {
      setError(true)
      return
    }
    setError(false)
    onSubmit(draft)
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border border-outline bg-surface p-xl text-on-surface shadow-high backdrop:bg-on-background/40"
    >
      {success ? (
        <div className="flex flex-col gap-lg">
          <p data-testid={successTestId} className="text-body">
            {successMessage}
          </p>
          <SecondaryButton type="button" onClick={onClose}>
            {strings.commonClose}
          </SecondaryButton>
        </div>
      ) : (
        <form data-testid={testId} onSubmit={submit} className="flex flex-col gap-md">
          <h2 className="text-headline">{title}</h2>
          <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
            {strings.venuesEnquireName}
            <input
              value={draft.coupleName}
              onChange={(event) => setDraft({ ...draft, coupleName: event.target.value })}
              placeholder={strings.venuesEnquireName}
              className="min-h-touch-target rounded-md border border-outline bg-background px-md text-body text-on-background placeholder:text-on-surface-variant"
            />
          </label>
          <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
            {strings.venuesEnquireEmail}
            <input
              type="email"
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              placeholder={strings.venuesEnquireEmail}
              className="min-h-touch-target rounded-md border border-outline bg-background px-md text-body text-on-background placeholder:text-on-surface-variant"
            />
          </label>
          <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
            {strings.venuesEnquireDate}
            <input
              type="date"
              value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })}
              className={`date-field min-h-touch-target rounded-md border border-outline bg-background px-md text-body ${draft.date ? 'text-on-background' : 'date-field-empty'}`}
            />
          </label>
          <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
            {strings.venuesEnquireGuests}
            <input
              inputMode="numeric"
              value={draft.guests}
              onChange={(event) => setDraft({ ...draft, guests: event.target.value })}
              placeholder={strings.venuesEnquireGuests}
              className="min-h-touch-target rounded-md border border-outline bg-background px-md text-body text-on-background placeholder:text-on-surface-variant"
            />
          </label>
          <label className="flex flex-col gap-xs text-caption text-on-surface-variant">
            {strings.venuesEnquireMessage}
            <textarea
              value={draft.message}
              onChange={(event) => setDraft({ ...draft, message: event.target.value })}
              placeholder={strings.venuesEnquireMessage}
              className="min-h-24 rounded-md border border-outline bg-background px-md py-sm text-body text-on-background placeholder:text-on-surface-variant"
            />
          </label>
          {error ? <p className="text-label text-error">{strings.venuesEnquireError}</p> : null}
          <div className="mt-sm flex flex-wrap gap-md">
            <PrimaryButton type="submit" data-testid={submitTestId}>
              {strings.venuesEnquireSubmit}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={onClose}>
              {strings.commonCancel}
            </SecondaryButton>
          </div>
        </form>
      )}
    </dialog>
  )
}
