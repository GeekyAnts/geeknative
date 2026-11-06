import type { ReactNode } from 'react'

/**
 * A horizontal row with CSS scroll snapping and smooth scrolling that bleeds to the screen edges on
 * phones while its first card lines up with the content padding.
 */
export function Carousel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`scrollbar-none -mx-lg flex snap-x snap-mandatory scroll-px-lg gap-md overflow-x-auto overscroll-x-contain scroll-smooth px-lg pb-xs md:-mx-xl md:scroll-px-xl md:px-xl ${className}`}
    >
      {children}
    </div>
  )
}
