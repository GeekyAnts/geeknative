import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconComponent } from '#/features/catalog/Labels'
import { focusRing, pressable } from './Buttons'

/** Class names of a round glass icon button: `glassOnImage` on photos, `glass` on content. */
export function glassIconButtonClass(onImage: boolean) {
  return `relative inline-flex size-touch-target shrink-0 items-center justify-center rounded-full border backdrop-blur-xl disabled:opacity-40 disabled:pointer-events-none ${pressable} ${focusRing} ${
    onImage ? 'border-glass-border bg-glass-on-image text-on-glass-on-image' : 'border-glass-border bg-glass text-on-surface shadow-low'
  }`
}

/** A `touchTarget` circle with an icon and a label from strings. */
export function GlassIconButton({
  icon: Icon,
  label,
  onImage = false,
  testId,
  className = '',
  iconClassName = '',
  iconKey,
  children,
  ...props
}: {
  icon: IconComponent
  label: string
  onImage?: boolean
  testId?: string
  className?: string
  iconClassName?: string
  /** Changing it remounts the icon, which replays its animation. */
  iconKey?: number
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} data-testid={testId} className={`${glassIconButtonClass(onImage)} ${className}`} {...props}>
      <Icon key={iconKey} className={`size-icon-md ${iconClassName}`} />
      {children}
    </button>
  )
}
