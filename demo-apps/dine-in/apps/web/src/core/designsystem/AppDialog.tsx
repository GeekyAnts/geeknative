import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The native `<dialog>` opened with `showModal()` (accessible, traps focus). Esc and a click on the
 * backdrop call `onClose`. Opening and closing animate (styles.css `.app-dialog`).
 */
export function AppDialog({
  open,
  onClose,
  labelledBy,
  sheet = false,
  className = '',
  children,
}: {
  open: boolean
  onClose: () => void
  labelledBy?: string
  sheet?: boolean
  className?: string
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      if (typeof element.showModal === 'function') element.showModal()
      else element.setAttribute('open', '')
    } else if (!open && element.open) {
      if (typeof element.close === 'function') element.close()
      else element.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={dialog}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose()
      }}
      className={`app-dialog bg-transparent p-0 text-on-surface backdrop:bg-transparent ${
        sheet
          ? 'app-sheet mx-0 mt-auto mb-0 w-full max-w-none md:m-auto md:w-full md:max-w-xl'
          : 'm-auto w-full max-w-sm px-lg'
      } ${className}`}
    >
      {children}
    </dialog>
  )
}
