import { useState } from 'react'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { GlassIconButton } from './GlassIconButton'

/** Heart that toggles a restaurant's saved state; the icon pops 1 → 1.25 → 1 on toggle. */
export function FavouriteButton({
  restaurantId,
  saved,
  onToggle,
  onImage = true,
  className = '',
}: {
  restaurantId: string
  saved: boolean
  onToggle: () => void
  onImage?: boolean
  className?: string
}) {
  const [pops, setPops] = useState(0)
  return (
    <GlassIconButton
      icon={saved ? AppIcons.heartFilled : AppIcons.heart}
      label={saved ? strings.restaurantUnsave : strings.restaurantSave}
      aria-pressed={saved}
      onImage={onImage}
      testId={`favourite.${restaurantId}`}
      iconKey={pops}
      iconClassName={`${saved ? 'text-accent' : ''} ${pops > 0 ? 'motion-safe:animate-heart-pop' : ''}`}
      className={className}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setPops((count) => count + 1)
        onToggle()
      }}
    />
  )
}
