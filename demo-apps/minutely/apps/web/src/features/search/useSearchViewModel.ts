import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type { Product } from '#/features/catalog/Catalog'
import { strings } from '#/generated/strings'

export type SearchState =
  | { status: 'prompt' }
  | { status: 'empty'; title: string }
  | { status: 'results'; products: Product[]; countText: string }

/** What Search shows for a query and its results (spec/features/search.md). */
export function searchState(query: string, results: Product[]): SearchState {
  const trimmed = query.trim()
  if (trimmed === '') return { status: 'prompt' }
  if (results.length === 0) return { status: 'empty', title: strings.searchNoResultsTitle({ query: trimmed }) }
  return { status: 'results', products: results, countText: strings.searchResultCount(results.length) }
}

/**
 * State and actions for the Search screen. The query lives in the URL (`/search?q=milk`), replaced as you
 * type so Back leaves Search.
 */
export function useSearchViewModel() {
  const { container } = useRouteContext({ from: '__root__' })
  const { q } = useSearch({ from: '/search' })
  const navigate = useNavigate({ from: '/search' })
  const [query, setQuery] = useState(q ?? '')
  const results = useMemo(() => container.catalogRepository.search(query), [container, query])

  const changeQuery = (next: string) => {
    setQuery(next)
    void navigate({ search: next === '' ? {} : { q: next }, replace: true, resetScroll: false })
  }

  return {
    query,
    state: searchState(query, results),
    changeQuery,
    clear: () => changeQuery(''),
  }
}
