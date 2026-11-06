import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { IconComponent } from '#/features/catalog/Labels'
import { secondaryButtonClass } from './Buttons'

/** Same shape as `PrimaryButton`: transparent with a `primary` hairline border and `primary` text. */
export function SecondaryButton({
  children,
  icon: Icon,
  testId,
  className = '',
  variantClass = secondaryButtonClass,
  ...props
}: {
  children: ReactNode
  icon?: IconComponent
  testId?: string
  className?: string
  variantClass?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" data-testid={testId} className={`${variantClass} ${className}`} {...props}>
      {Icon && <Icon className="size-icon-sm" />}
      {children}
    </button>
  )
}
