import type { ReactNode } from 'react'
import { RemoteImage } from './RemoteImage'

/** Image-led destination or place card. */
export function PhotoCard({
  imageUrl,
  fallbackUrl,
  name,
  imageClassName = 'h-card-image',
  overlay,
  children,
  className = '',
}: {
  imageUrl: string
  fallbackUrl: string
  name: string
  imageClassName?: string
  overlay?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <article className={`overflow-hidden rounded-xl bg-surface shadow-low ${className}`}>
      <div className={`relative ${imageClassName}`}>
        <RemoteImage src={imageUrl} fallbackSrc={fallbackUrl} alt={name} className="size-full" />
        {overlay ? (
          <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-overlay to-transparent p-md pt-xl">
            {overlay}
          </div>
        ) : null}
      </div>
      {children}
    </article>
  )
}
