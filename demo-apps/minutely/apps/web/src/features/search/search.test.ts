import { describe, expect, test } from 'vitest'
import { LocalCatalogRepository } from '#/features/catalog/LocalCatalogRepository'
import { strings } from '#/generated/strings'
import { searchState } from './useSearchViewModel'

const catalog = new LocalCatalogRepository()
const ids = (query: string) => catalog.search(query).map((product) => product.id)

describe('Search', () => {
  test('AC-search-1: a blank or whitespace-only query shows the prompt and no results', () => {
    expect(ids('')).toEqual([])
    expect(ids('   ')).toEqual([])
    expect(searchState('  ', catalog.search('  '))).toEqual({ status: 'prompt' })
  })

  test('AC-search-2: every word must match the name or category, case-insensitively, in catalog order', () => {
    expect(ids('MILK')).toEqual(['milk'])
    expect(ids('choco')).toEqual(['cookies', 'chocolate'])
    expect(ids('fruit')).toEqual(['banana', 'apple', 'tomato', 'avocado', 'carrot'])
    expect(ids('salted chips')).toEqual(['chips'])
    expect(ids('xyz')).toEqual([])
    expect(ids('  Salted   CHIPS ')).toEqual(['chips'])
  })

  test('AC-search-3: no matches shows the no-results state, naming the trimmed query', () => {
    expect(searchState(' xyz ', catalog.search(' xyz '))).toEqual({
      status: 'empty',
      title: strings.searchNoResultsTitle({ query: 'xyz' }),
    })
  })

  test('AC-search-4: results come with their count', () => {
    const state = searchState('choco', catalog.search('choco'))
    expect(state.status).toBe('results')
    if (state.status === 'results') expect(state.countText).toBe(strings.searchResultCount(2))
  })
})
