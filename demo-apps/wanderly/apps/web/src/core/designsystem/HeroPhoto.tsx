import type { ReactNode } from 'react'
import { RemoteImage } from './RemoteImage'

/** Full-width magazine hero with a bottom overlay scrim. */
export function HeroPhoto({
  imageUrl,
  fallbackUrl,
  name,
  heightClassName,
  testId,
  children,
  corner,
}: {
  imageUrl: string
  fallbackUrl: string
  name: string
  heightClassName: string
  testId?: string
  children: ReactNode
  corner?: ReactNode
}) {
  return (
    <div data-testid={testId} className={`relative overflow-hidden rounded-xl shadow-low ${heightClassName}`}>
      <RemoteImage
        src={imageUrl}
        fallbackSrc={fallbackUrl}
        alt={name}
        priority
        className="absolute inset-0 size-full"
      />
      <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-overlay to-transparent p-lg pt-xxl">
        {children}
      </div>
      {corner ? <div className="absolute top-md right-md">{corner}</div> : null}
    </div>
  )
}
