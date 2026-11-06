import type { ButtonHTMLAttributes } from 'react'

export const primaryClass =
  'inline-flex min-h-touch-target items-center justify-center gap-sm rounded-full bg-primary px-xl text-label text-on-primary motion-safe:transition motion-safe:duration-fast motion-safe:ease-standard hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary'

export const secondaryClass =
  'inline-flex min-h-touch-target items-center justify-center gap-sm rounded-full border border-primary bg-transparent px-xl text-label text-primary motion-safe:transition motion-safe:duration-fast motion-safe:ease-standard hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function PrimaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`${primaryClass} ${className}`} {...props} />
}

export function SecondaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`${secondaryClass} ${className}`} {...props} />
}
