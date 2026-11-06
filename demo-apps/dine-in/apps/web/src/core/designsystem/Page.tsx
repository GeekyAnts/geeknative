import type { ReactNode } from 'react'

const widthClass = {
  /** Forms, Profile, Settings and detail text columns. */
  readable: 'mx-auto max-w-3xl',
  /** Sign in and Sign up. */
  form: 'mx-auto max-w-xl',
  /** Discover, Explore, Saved and Reservations. */
  wide: 'mx-auto max-w-6xl',
  /** Edge to edge, for photography. */
  full: '',
}

/**
 * A screen's content column (DESIGN.md: Screen layout): side padding `lg` on phones, centred on
 * wide windows. `tabs` leaves room for the floating tab bar.
 */
export function Page({
  width = 'readable',
  tabs = false,
  className = '',
  children,
}: {
  width?: keyof typeof widthClass
  tabs?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`flex w-full flex-col gap-xl px-lg md:px-xl ${widthClass[width]} ${tabs ? 'pb-floating' : 'pb-xxxl'} ${className}`}>
      {children}
    </div>
  )
}
