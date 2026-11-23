import { StruckMrp } from '#/core/designsystem/Price'
import { useCart } from '#/features/cart/useCart'
import { strings } from '#/generated/strings'
import { discountPercent, tileClass, type Product } from './Catalog'
import { QuantityStepper } from './QuantityStepper'

/** A product with its artwork, discount, unit, name, price and add control (DESIGN.md: Product card). */
export function ProductCard({ product, className = '' }: { product: Product; className?: string }) {
  const cart = useCart()
  const discount = discountPercent(product)

  return (
    <article
      data-testid={`product.${product.id}`}
      className={`group flex flex-col gap-sm rounded-lg bg-surface p-sm text-on-surface transition-shadow duration-300 hover:shadow-lg hover:shadow-on-background/5 ${className}`}
    >
      <div className={`relative grid aspect-4/3 place-items-center overflow-hidden rounded-lg ${tileClass(product.categoryId)}`}>
        <span aria-hidden className="select-none text-6xl drop-shadow-sm transition-transform duration-300 motion-safe:group-hover:scale-110 sm:text-7xl">
          {product.emoji}
        </span>
        {discount > 0 && (
          <span className="absolute start-sm top-sm rounded-sm bg-deal px-sm py-xs text-caption font-bold text-on-deal">
            {strings.commonPercentOff({ percent: discount })}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-xs px-xs pb-xs">
        <p className="text-caption text-on-surface-variant">{product.unit}</p>
        <h3 className="line-clamp-2 min-h-10 text-label font-semibold">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between gap-sm pt-xs">
          <p className="flex flex-col">
            <span className="text-body font-bold">{strings.commonPrice({ amount: product.price })}</span>
            {product.mrp > product.price && <StruckMrp amount={product.mrp} />}
          </p>
          <QuantityStepper
            productId={product.id}
            name={product.name}
            quantity={cart.quantity(product.id)}
            onAdd={() => void cart.add(product.id)}
            onRemove={() => void cart.remove(product.id)}
          />
        </div>
      </div>
    </article>
  )
}

/** Product cards in a grid: two columns on narrow screens, up to four on wide ones. */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
