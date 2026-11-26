import { useState } from 'react'

/** Loads a catalog photo: placeholder → image → fallback → placeholder. */
export function RemoteImage({
  src,
  fallbackSrc,
  alt,
  className = '',
  priority = false,
}: {
  src: string
  fallbackSrc: string
  alt: string
  className?: string
  priority?: boolean
}) {
  const [phase, setPhase] = useState<'primary' | 'fallback' | 'hidden'>('primary')
  const url = phase === 'primary' ? src : phase === 'fallback' ? fallbackSrc : undefined

  return (
    <div className={`overflow-hidden bg-surface-variant ${className}`}>
      {url ? (
        <img
          src={url}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="size-full object-cover motion-safe:transition motion-safe:duration-normal motion-safe:ease-standard"
          onError={() => {
            if (phase === 'primary' && fallbackSrc && fallbackSrc !== src) setPhase('fallback')
            else setPhase('hidden')
          }}
        />
      ) : null}
    </div>
  )
}
