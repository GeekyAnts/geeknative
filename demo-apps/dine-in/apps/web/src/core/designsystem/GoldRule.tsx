/** A short gold bar under editorial overlines (DESIGN.md: GoldRule). */
export function GoldRule({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block h-xxs w-xxl rounded-full bg-accent ${className}`} />
}
