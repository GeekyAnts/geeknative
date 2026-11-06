import { useEffect, useRef, useState } from 'react'
import { AppIcons } from '#/generated/icons'

type LoadState = 'loading' | 'loaded' | 'failed'

/**
 * A photo from a URL that fills its box: a shimmering skeleton until it loads, a `utensils`
 * placeholder if it fails. `priority` is for hero images above the fold.
 */
export function RemoteImage({
  src,
  alt,
  className = '',
  imageClassName = '',
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  imageClassName?: string
  priority?: boolean
}) {
  const [state, setState] = useState<LoadState>('loading')
  const image = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setState('loading')
    const element = image.current
    // A cached image can finish loading before React attaches onLoad.
    if (element?.complete && element.naturalWidth > 0) setState('loaded')
  }, [src])

  return (
    <div className={`relative overflow-hidden bg-surface-variant ${className}`}>
      {state === 'loading' && <div aria-hidden="true" className="skeleton absolute inset-0" />}
      {state === 'failed' ? (
        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
          <AppIcons.utensils className="size-icon-xl" />
        </div>
      ) : (
        <img
          ref={image}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          className={`size-full object-cover motion-safe:transition-opacity motion-safe:duration-slow motion-safe:ease-standard ${
            state === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${imageClassName}`}
        />
      )}
    </div>
  )
}
