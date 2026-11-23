import { Link } from '@tanstack/react-router'
import { CartBar, CartBarSpacer } from '#/features/cart/CartBar'
import { CategoryTile } from '#/features/catalog/CategoryTile'
import { ProductCard } from '#/features/catalog/ProductCard'
import { AppIdentity } from '#/generated/app'
import { AppIcons } from '#/generated/icons'
import { strings } from '#/generated/strings'
import { useHomeViewModel } from './useHomeViewModel'

export function HomeScreen() {
  const viewModel = useHomeViewModel()

  return (
    <div className="flex flex-col gap-xl">
      {/* The site header shows the app name; the delivery promise leads visually (spec/features/home.md). */}
      <h1 className="sr-only">{AppIdentity.name}</h1>

      <div className="flex flex-col gap-lg md:flex-row md:items-center md:justify-between">
        <section data-testid="home.delivery" className="flex flex-col gap-xs">
          <div className="flex items-center gap-md">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent shadow-sm">
              <AppIcons.fast aria-hidden className="size-icon-md" />
            </span>
            <p className="text-headline">{viewModel.deliveryPromise}</p>
          </div>
          <p className="flex items-center gap-xs ps-14 text-label text-on-surface-variant">
            <AppIcons.location aria-hidden className="size-icon-sm shrink-0" />
            {viewModel.deliveryAddress}
          </p>
        </section>

        <Link
          to="/search"
          data-testid="home.search"
          className="flex min-h-12 w-full items-center gap-md rounded-full border border-outline bg-surface px-lg text-body text-on-surface-variant shadow-sm transition hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:max-w-(--container-sm)"
        >
          <AppIcons.search aria-hidden className="size-icon-md shrink-0" />
          <span className="truncate">{strings.searchPlaceholder}</span>
        </Link>
      </div>

      <section
        data-testid="home.banner"
        className="relative isolate overflow-hidden rounded-xl bg-banner p-xl text-on-banner sm:p-xxl"
      >
        <div aria-hidden className="absolute -end-16 -top-24 -z-10 size-72 rounded-full bg-on-banner/5" />
        <div aria-hidden className="absolute -bottom-24 end-32 -z-10 size-48 rounded-full bg-on-banner/5" />
        <div className="flex max-w-(--container-md) flex-col items-start gap-sm pe-24 sm:pe-0">
          <span className="inline-flex items-center gap-xs rounded-full bg-accent px-md py-xs text-caption font-bold text-on-accent">
            <AppIcons.fast aria-hidden className="size-icon-sm" />
            {strings.homeBannerEyebrow}
          </span>
          <h2 className="mt-xs text-headline">{strings.homeBannerTitle}</h2>
          <p className="text-body text-on-banner/80">{viewModel.bannerBody}</p>
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-2 end-lg select-none text-8xl drop-shadow-lg motion-safe:-rotate-12 sm:end-xxl sm:text-9xl"
        >
          🛒
        </span>
      </section>

      <section className="flex flex-col gap-lg">
        <h2 className="text-title">{strings.homeCategoriesTitle}</h2>
        <div className="grid grid-cols-3 gap-x-md gap-y-lg md:grid-cols-6">
          {viewModel.categories.map((category) => (
            <CategoryTile key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-lg">
        <h2 className="text-title">{strings.homeBestsellersTitle}</h2>
        <div className="-mx-lg flex snap-x snap-mandatory scroll-px-lg gap-md overflow-x-auto px-lg pb-sm scrollbar-none md:mx-0 md:scroll-px-0 md:px-0">
          {viewModel.bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} className="w-40 shrink-0 snap-start sm:w-48" />
          ))}
        </div>
      </section>

      <CartBarSpacer />
      <CartBar />
    </div>
  )
}
