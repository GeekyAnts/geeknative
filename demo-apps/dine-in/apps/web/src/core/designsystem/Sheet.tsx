import { useId, type ReactNode } from 'react'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { AppDialog } from './AppDialog'
import { AppSerif } from './AppSerif'
import { GlassIconButton } from './GlassIconButton'

/** A `<dialog>` styled as a bottom sheet on narrow screens and a centred panel on wide ones. */
export function Sheet({
  open,
  onClose,
  title,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  footer?: ReactNode
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <AppDialog open={open} onClose={onClose} labelledBy={titleId} sheet>
      <div className="flex max-h-sheet flex-col rounded-t-xl bg-background shadow-high md:rounded-xl">
        <div className="flex items-center justify-between gap-md border-b border-outline px-xl py-md">
          <AppSerif role="title" as="h2" id={titleId}>
            {title}
          </AppSerif>
          <GlassIconButton icon={AppIcons.close} label={strings.commonClose} onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-xl py-lg">{children}</div>
        {footer && <div className="border-t border-outline px-xl pt-md pb-safe-md">{footer}</div>}
      </div>
    </AppDialog>
  )
}
