import type { ComponentType, ReactNode, SVGProps } from 'react'

/** Centered icon in a `surfaceVariant` circle, title, body and an optional action (DESIGN.md: Empty state). */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  testId,
  headingLevel = 2,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  body: string
  action?: ReactNode
  testId?: string
  headingLevel?: 1 | 2
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <div data-testid={testId} className="flex flex-col items-center gap-md px-lg py-xxl text-center motion-safe:animate-fade-up">
      <div className="mb-sm grid size-24 place-items-center rounded-full bg-surface-variant text-on-surface-variant">
        <Icon aria-hidden className="size-12" />
      </div>
      <Heading className="text-title">{title}</Heading>
      <p className="max-w-(--container-sm) text-body text-on-surface-variant">{body}</p>
      {action && <div className="mt-md">{action}</div>}
    </div>
  )
}
