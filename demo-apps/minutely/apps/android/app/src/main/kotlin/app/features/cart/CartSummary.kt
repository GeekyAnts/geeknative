package app.features.cart

import app.features.catalog.CatalogRepository
import app.generated.AppConfig

/** The cart's totals (spec/features/cart.md, "Cart summary"). A pure function of the lines and the catalog. */
data class CartSummary(
    val itemCount: Int = 0,
    val itemTotal: Int = 0,
    val mrpTotal: Int = 0,
    val savings: Int = 0,
    val deliveryFee: Int = 0,
    val toPay: Int = 0,
    val amountToFreeDelivery: Int = 0,
    val freeDeliveryThreshold: Int = 0,
) {
    /** How far the item total is toward free delivery, from 0 to 1. */
    val freeDeliveryProgress: Float
        get() = if (freeDeliveryThreshold <= 0) 1f else (itemTotal.toFloat() / freeDeliveryThreshold).coerceIn(0f, 1f)

    companion object {
        fun of(
            lines: List<CartLine>,
            catalog: CatalogRepository,
            freeDeliveryThreshold: Int = AppConfig.freeDeliveryThreshold,
            deliveryFee: Int = AppConfig.deliveryFee,
        ): CartSummary {
            var itemCount = 0
            var itemTotal = 0
            var mrpTotal = 0
            for (line in lines) {
                val product = catalog.product(line.productId) ?: continue
                itemCount += line.quantity
                itemTotal += product.price * line.quantity
                mrpTotal += product.mrp * line.quantity
            }
            val fee = if (itemCount == 0 || itemTotal >= freeDeliveryThreshold) 0 else deliveryFee
            return CartSummary(
                itemCount = itemCount,
                itemTotal = itemTotal,
                mrpTotal = mrpTotal,
                savings = mrpTotal - itemTotal,
                deliveryFee = fee,
                toPay = itemTotal + fee,
                amountToFreeDelivery = maxOf(0, freeDeliveryThreshold - itemTotal),
                freeDeliveryThreshold = freeDeliveryThreshold,
            )
        }
    }
}

/** What every screen with product cards needs from the cart: each product's quantity and the totals for the cart bar. */
data class CartState(
    val quantities: Map<String, Int> = emptyMap(),
    val summary: CartSummary = CartSummary(),
) {
    fun quantity(productId: String): Int = quantities[productId] ?: 0

    companion object {
        fun of(lines: List<CartLine>, catalog: CatalogRepository) = CartState(
            quantities = lines.associate { it.productId to it.quantity },
            summary = CartSummary.of(lines, catalog),
        )
    }
}
