import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'

/** The demonstration-data note, so demo availability is never presented as live. */
export function DemoNote({ text = strings.commonDemoAvailabilityNote, className = '' }: { text?: string; className?: string }) {
  return (
    <aside data-testid="demoNote" className={`flex items-start gap-sm rounded-md bg-surface-variant p-md text-on-surface-variant ${className}`}>
      <AppIcons.info className="mt-xxs size-icon-sm shrink-0" />
      <p className="flex-1 text-caption">{text}</p>
      <span className="shrink-0 rounded-full bg-accent px-sm py-xxs text-overline uppercase tracking-(--spacing-tracking) text-on-accent">
        {strings.commonDemoBadge}
      </span>
    </aside>
  )
}
