export function Photo({
  src,
  alt,
  className = '',
  cinematic = false,
}: {
  src: string
  alt: string
  className?: string
  cinematic?: boolean
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${cinematic ? 'motion-safe:animate-ken-burns' : 'motion-safe:transition motion-safe:duration-slow motion-safe:ease-standard motion-safe:hover:scale-105'} ${className}`}
    />
  )
}
