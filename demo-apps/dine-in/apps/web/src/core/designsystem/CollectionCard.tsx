import { Link } from '@tanstack/react-router'
import type { Collection } from '#/features/catalog/Catalog'
import { collectionSubtitle, collectionTitle } from '#/features/catalog/Labels'
import { AppSerif } from './AppSerif'
import { focusRing } from './Buttons'
import { glassClass } from './GlassSurface'
import { PhotoScrim } from './PhotoScrim'
import { RemoteImage } from './RemoteImage'

/** An editorial collection photo card; opens Explore filtered by the collection. */
export function CollectionCard({ collection, testId }: { collection: Collection; testId?: string }) {
  return (
    <Link
      to="/explore"
      search={{ collection: collection.id }}
      data-testid={testId}
      className={`group relative block h-collection-card-height w-(--spacing-collection-card-width) shrink-0 snap-start overflow-hidden rounded-lg bg-espresso motion-safe:transition motion-safe:duration-snappy motion-safe:ease-snappy active:scale-97 ${focusRing}`}
    >
      <RemoteImage
        src={collection.image}
        alt=""
        className="absolute inset-0"
        imageClassName="motion-safe:transition-transform motion-safe:duration-page motion-safe:ease-standard group-hover:scale-105"
      />
      <PhotoScrim />
      <div className={`absolute inset-x-md bottom-md flex flex-col gap-xxs rounded-md p-md text-on-surface ${glassClass({ strong: true })}`}>
        <AppSerif role="title" as="h3">
          {collectionTitle(collection.id)}
        </AppSerif>
        <p className="text-caption text-on-surface-variant">{collectionSubtitle(collection.id)}</p>
      </div>
    </Link>
  )
}
