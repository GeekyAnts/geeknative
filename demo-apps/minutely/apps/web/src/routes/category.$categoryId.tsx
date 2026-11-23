import { createFileRoute } from '@tanstack/react-router'
import { CategoryScreen } from '#/features/catalog/CategoryScreen'
import { resolveCategory } from '#/features/catalog/useCategoryViewModel'
import { AppIdentity } from '#/generated/app'

export const Route = createFileRoute('/category/$categoryId')({
  loader: ({ context, params }) => ({ title: resolveCategory(context.container.catalogRepository, params.categoryId).name }),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.title} · ${AppIdentity.name}` : AppIdentity.name }] }),
  component: CategoryScreen,
})
