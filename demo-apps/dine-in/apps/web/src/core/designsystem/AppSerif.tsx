import type { ElementType, HTMLAttributes, ReactNode } from 'react'

export type SerifRole = 'hero' | 'display' | 'headline' | 'title'

const roleClass: Record<SerifRole, string> = {
  hero: 'text-hero',
  display: 'text-display',
  headline: 'text-headline',
  title: 'text-title',
}

/** Serif class names for a type role; the italic accent uses Medium Italic. */
export function serifClass(role: SerifRole, italic = false) {
  return `font-serif ${roleClass[role]} ${italic ? 'italic font-medium' : 'font-semibold'}`
}

/** Cormorant Garamond with the size and line height of the matching typography token (DESIGN.md: Type roles). */
export function AppSerif({
  role,
  italic = false,
  as: Tag = 'span',
  className = '',
  children,
  ...props
}: { role: SerifRole; italic?: boolean; as?: ElementType; className?: string; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`${serifClass(role, italic)} ${className}`} {...props}>
      {children}
    </Tag>
  )
}
