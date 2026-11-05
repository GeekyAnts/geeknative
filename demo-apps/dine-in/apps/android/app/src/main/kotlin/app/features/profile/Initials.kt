package app.features.profile

/** Member names, as shown on Discover and Profile. */
object MemberName {
    /** First letter of the first and last words, uppercased; one letter for a one-word name. */
    fun initials(name: String): String {
        val words = name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
        if (words.isEmpty()) return ""
        val first = words.first().first().uppercase()
        return if (words.size == 1) first else first + words.last().first().uppercase()
    }

    /** The text before the first space. */
    fun firstName(name: String): String = name.trim().substringBefore(' ')
}
