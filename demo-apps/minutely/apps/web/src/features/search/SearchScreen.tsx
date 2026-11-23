import { useEffect, useRef } from 'react'
import { EmptyState } from '#/core/designsystem/EmptyState'
import { CartBar, CartBarSpacer } from '#/features/cart/CartBar'
import { ProductGrid } from '#/features/catalog/ProductCard'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useSearchViewModel } from './useSearchViewModel'

export function SearchScreen() {
  const viewModel = useSearchViewModel()
  const field = useRef<HTMLInputElement>(null)

  // The field is focused when the screen opens.
  useEffect(() => {
    field.current?.focus()
  }, [])

  return (
    <div className="flex flex-col gap-xl">
      <h1 className="sr-only">{strings.searchTitle}</h1>

      <div className="relative">
        <AppIcons.search
          aria-hidden
          className="pointer-events-none absolute start-lg top-1/2 size-icon-md -translate-y-1/2 text-on-surface-variant"
        />
        <input
          ref={field}
          type="search"
          data-testid="search.field"
          aria-label={strings.searchTitle}
          placeholder={strings.searchPlaceholder}
          value={viewModel.query}
          onChange={(event) => viewModel.changeQuery(event.target.value)}
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          className="min-h-14 w-full rounded-full border border-outline bg-surface ps-14 pe-14 text-body text-on-surface shadow-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
        {viewModel.query !== '' && (
          <button
            type="button"
            data-testid="search.clear"
            aria-label={strings.searchClear}
            onClick={() => {
              viewModel.clear()
              field.current?.focus()
            }}
            className="absolute end-sm top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-primary"
          >
            <AppIcons.clear aria-hidden className="size-icon-sm" />
          </button>
        )}
      </div>

      {viewModel.state.status === 'prompt' && (
        <EmptyState
          testId="search.prompt"
          icon={AppIcons.search}
          title={strings.searchPromptTitle}
          body={strings.searchPromptBody}
        />
      )}

      {viewModel.state.status === 'empty' && (
        <EmptyState
          testId="search.empty"
          icon={AppIcons.noResults}
          title={viewModel.state.title}
          body={strings.searchNoResultsBody}
        />
      )}

      {viewModel.state.status === 'results' && (
        <section className="flex flex-col gap-md">
          <p data-testid="search.resultCount" aria-live="polite" className="text-label text-on-surface-variant">
            {viewModel.state.countText}
          </p>
          <ProductGrid products={viewModel.state.products} />
        </section>
      )}

      <CartBarSpacer />
      <CartBar />
    </div>
  )
}
