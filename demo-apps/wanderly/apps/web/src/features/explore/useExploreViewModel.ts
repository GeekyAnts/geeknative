import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCatalog } from '#/features/catalog/useCatalog'
import { searchCatalog } from './searchCatalog'
import type { CategoryId } from '#/features/catalog/types'

export function useExploreViewModel() {
  const catalogQuery = useCatalog()
  const navigate = useNavigate()
  const search = useSearch({ from: '/explore' })
  const [draft, setDraft] = useState(search.q ?? '')

  useEffect(() => {
    setDraft(search.q ?? '')
  }, [search.q])

  const catalog = catalogQuery.data
  const results = catalog
    ? searchCatalog(catalog, { q: draft, category: search.category })
    : { destinations: [], places: [] }
  const isEmpty = Boolean(catalog) && results.destinations.length === 0 && results.places.length === 0

  return {
    query: draft,
    category: search.category as CategoryId | undefined,
    fallbackImageUrl: catalog?.fallbackImageUrl ?? '',
    destinations: results.destinations,
    places: results.places,
    isEmpty,
    destinationName: (id: string) => catalog?.destinations.find((destination) => destination.id === id)?.name ?? id,
    setQuery: setDraft,
    submitQuery: () => {
      const q = draft.trim()
      void navigate({
        to: '/explore',
        search: { q: q || undefined, category: search.category },
      })
    },
    selectCategory: (category: CategoryId) => {
      void navigate({
        to: '/explore',
        search: {
          q: search.q,
          category: search.category === category ? undefined : category,
        },
      })
    },
    clearFilters: () => {
      setDraft('')
      void navigate({ to: '/explore', search: { q: undefined, category: undefined } })
    },
  }
}
