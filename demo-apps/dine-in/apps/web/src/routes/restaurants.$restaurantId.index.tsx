import { createFileRoute } from '@tanstack/react-router'
import { catalogQuery } from '#/features/catalog/useCatalog'
import { RestaurantScreen } from '#/features/restaurant/RestaurantScreen'
import { AppIdentity } from '#/generated/app'
import { strings } from '#/generated/strings'

export const Route = createFileRoute('/restaurants/$restaurantId/')({
  loader: async ({ context, params }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQuery(context.container.catalogRepository))
    return { name: catalog.restaurants.find((r) => r.id === params.restaurantId)?.name }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? strings.restaurantNotFoundTitle} · ${AppIdentity.name}` }],
  }),
  component: RestaurantRoute,
})

function RestaurantRoute() {
  return <RestaurantScreen restaurantId={Route.useParams().restaurantId} />
}
