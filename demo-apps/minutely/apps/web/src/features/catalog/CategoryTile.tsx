import { Link } from '@tanstack/react-router'
import { tileClass, type Category } from './Catalog'

/** A category's emoji on its tint, with its name below. Opens the Category screen (DESIGN.md: Category tile). */
export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      to="/category/$categoryId"
      params={{ categoryId: category.id }}
      data-testid={`category.${category.id}`}
      className="group flex flex-col items-center gap-sm rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <span
        className={`grid aspect-square w-full place-items-center rounded-lg transition duration-300 group-hover:shadow-lg group-hover:shadow-on-background/5 motion-safe:group-hover:-translate-y-1 ${tileClass(category.id)}`}
      >
        <span aria-hidden className="select-none text-5xl drop-shadow-sm transition-transform duration-300 motion-safe:group-hover:scale-110 sm:text-6xl">
          {category.emoji}
        </span>
      </span>
      <span className="line-clamp-2 text-center text-label font-semibold text-on-background">{category.name}</span>
    </Link>
  )
}
