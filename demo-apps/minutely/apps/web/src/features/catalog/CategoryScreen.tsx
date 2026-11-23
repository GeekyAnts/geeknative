import { Link, useParams } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { CartBar, CartBarSpacer } from '#/features/cart/CartBar'
import { tileClass } from './Catalog'
import { ProductGrid } from './ProductCard'
import { useCategoryViewModel } from './useCategoryViewModel'

export function CategoryScreen() {
  const { categoryId } = useParams({ from: '/category/$categoryId' })
  const viewModel = useCategoryViewModel(categoryId)
  const selectedChip = useRef<HTMLAnchorElement>(null)

  // Keep the current chip in view when the screen opens or switches category.
  useEffect(() => {
    selectedChip.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [viewModel.category.id])

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex items-center gap-md">
        <span
          aria-hidden
          className={`grid size-14 shrink-0 place-items-center rounded-lg text-3xl ${tileClass(viewModel.category.id)}`}
        >
          {viewModel.category.emoji}
        </span>
        <div className="flex flex-col">
          <h1 className="text-headline">{viewModel.category.name}</h1>
          <p className="text-label text-on-surface-variant">{viewModel.countText}</p>
        </div>
      </div>

      <div className="-mx-lg -my-xs flex gap-sm overflow-x-auto px-lg py-xs scrollbar-none">
        {viewModel.categories.map((category) => {
          const selected = category.id === viewModel.category.id
          return (
            <Link
              key={category.id}
              ref={selected ? selectedChip : undefined}
              to="/category/$categoryId"
              params={{ categoryId: category.id }}
              // Switching category doesn't push a new screen (spec/features/catalog.md).
              replace
              data-testid={`category.chip.${category.id}`}
              aria-current={selected ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-sm rounded-full border px-lg text-label font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                selected
                  ? 'border-primary bg-primary text-on-primary shadow-sm'
                  : 'border-outline bg-surface text-on-surface hover:border-primary'
              }`}
            >
              <span aria-hidden>{category.emoji}</span>
              {category.name}
            </Link>
          )
        })}
      </div>

      <ProductGrid products={viewModel.products} />

      <CartBarSpacer />
      <CartBar />
    </div>
  )
}
