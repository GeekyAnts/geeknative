package app.features.catalog

/** A group of products, such as Fruits & Vegetables (PRODUCT.md). */
data class Category(val id: String, val name: String, val emoji: String)

/** Something you can buy. Prices are whole rupees. */
data class Product(
    val id: String,
    val name: String,
    val unit: String,
    val price: Int,
    val mrp: Int,
    val emoji: String,
    val categoryId: String,
    val isBestseller: Boolean,
) {
    /** `(mrp - price) * 100 / mrp`, rounded down. 0 means no badge and no struck-through MRP. */
    val discountPercent: Int get() = if (mrp <= 0) 0 else (mrp - price) * 100 / mrp
}

/** The products and categories the store sells (spec/features/catalog.md). */
interface CatalogRepository {
    fun categories(): List<Category>

    fun products(categoryId: String): List<Product>

    fun product(id: String): Product?

    fun bestsellers(): List<Product>

    /** Every word of the trimmed, lowercased query appears in the product's name + category name (spec/features/search.md). */
    fun search(query: String): List<Product>
}

/** The catalog bundled with the app. Identical data, in the same order, on every platform. */
class LocalCatalogRepository : CatalogRepository {
    private val categories = listOf(
        Category("fruits", "Fruits & Vegetables", "🥦"),
        Category("dairy", "Dairy, Bread & Eggs", "🥛"),
        Category("snacks", "Snacks & Munchies", "🍿"),
        Category("drinks", "Cold Drinks & Juices", "🧃"),
        Category("household", "Cleaning Essentials", "🧽"),
        Category("personal", "Personal Care", "🧴"),
    )

    private val products = listOf(
        Product("banana", "Robusta Banana", "6 pcs", 49, 60, "🍌", "fruits", true),
        Product("apple", "Shimla Apple", "4 pcs", 129, 160, "🍎", "fruits", true),
        Product("tomato", "Hybrid Tomato", "500 g", 24, 30, "🍅", "fruits", false),
        Product("avocado", "Hass Avocado", "1 pc", 149, 199, "🥑", "fruits", false),
        Product("carrot", "Ooty Carrot", "500 g", 39, 45, "🥕", "fruits", false),
        Product("milk", "Toned Milk", "500 ml", 28, 28, "🥛", "dairy", true),
        Product("eggs", "Farm Fresh Eggs", "6 pcs", 54, 60, "🥚", "dairy", false),
        Product("bread", "Whole Wheat Bread", "400 g", 45, 50, "🍞", "dairy", true),
        Product("cheese", "Cheese Slices", "200 g", 135, 150, "🧀", "dairy", false),
        Product("butter", "Salted Butter", "100 g", 58, 60, "🧈", "dairy", false),
        Product("chips", "Classic Salted Chips", "52 g", 20, 20, "🍟", "snacks", false),
        Product("popcorn", "Butter Popcorn", "90 g", 45, 55, "🍿", "snacks", false),
        Product("cookies", "Choco Chip Cookies", "150 g", 60, 75, "🍪", "snacks", true),
        Product("chocolate", "Dark Chocolate 70%", "100 g", 175, 199, "🍫", "snacks", true),
        Product("pretzels", "Salted Pretzels", "100 g", 99, 120, "🥨", "snacks", false),
        Product("cola", "Cola Can", "300 ml", 40, 40, "🥤", "drinks", false),
        Product("orange-juice", "Fresh Orange Juice", "1 L", 125, 150, "🍊", "drinks", true),
        Product("coconut-water", "Tender Coconut Water", "200 ml", 55, 60, "🥥", "drinks", false),
        Product("cold-brew", "Cold Brew Coffee", "250 ml", 120, 150, "☕", "drinks", false),
        Product("water", "Mineral Water", "1 L", 20, 20, "💧", "drinks", false),
        Product("sponges", "Scrub Sponges", "3 pcs", 49, 60, "🧽", "household", false),
        Product("detergent", "Liquid Detergent", "1 L", 199, 249, "🫧", "household", true),
        Product("kitchen-towels", "Kitchen Towels", "2 rolls", 89, 110, "🧻", "household", false),
        Product("broom", "Soft Broom", "1 pc", 149, 199, "🧹", "household", false),
        Product("garbage-bags", "Garbage Bags", "30 pcs", 79, 99, "🗑️", "household", false),
        Product("toothpaste", "Herbal Toothpaste", "150 g", 95, 110, "🪥", "personal", false),
        Product("shampoo", "Daily Shampoo", "340 ml", 245, 299, "🧴", "personal", false),
        Product("soap", "Moisturising Soap", "4 × 100 g", 160, 200, "🧼", "personal", true),
        Product("lip-balm", "Lip Balm", "4.5 g", 99, 125, "💄", "personal", false),
        Product("razor", "Classic Razor", "1 pc", 149, 175, "🪒", "personal", false),
    )

    private val byId = products.associateBy { it.id }
    private val categoryNames = categories.associate { it.id to it.name }

    override fun categories(): List<Category> = categories

    override fun products(categoryId: String): List<Product> = products.filter { it.categoryId == categoryId }

    override fun product(id: String): Product? = byId[id]

    override fun bestsellers(): List<Product> = products.filter { it.isBestseller }

    override fun search(query: String): List<Product> {
        val words = query.trim().lowercase().split(Regex("\\s+")).filter { it.isNotEmpty() }
        if (words.isEmpty()) return emptyList()
        return products.filter { product ->
            val haystack = "${product.name} ${categoryNames[product.categoryId].orEmpty()}".lowercase()
            words.all { it in haystack }
        }
    }
}
