package app.core.designsystem

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import app.R
import app.generated.AppTypography

/**
 * Cormorant Garamond for headings and restaurant names (DESIGN.md: Type roles), at the size and line
 * height of the matching typography token. SemiBold for the roles; Medium Italic for [italic].
 */
object AppSerif {
    private val family = FontFamily(
        Font(R.font.display_semi_bold, FontWeight.SemiBold),
        Font(R.font.display_medium, FontWeight.Medium),
        Font(R.font.display_medium_italic, FontWeight.Medium, FontStyle.Italic),
    )

    private fun serif(token: TextStyle) = token.copy(fontFamily = family, fontWeight = FontWeight.SemiBold, fontStyle = FontStyle.Normal)

    val hero: TextStyle = serif(AppTypography.hero)
    val display: TextStyle = serif(AppTypography.display)
    val headline: TextStyle = serif(AppTypography.headline)
    val title: TextStyle = serif(AppTypography.title)

    /** The italic accent, used at most once per screen for an emphasised phrase. */
    fun italic(role: TextStyle): TextStyle = role.copy(fontFamily = family, fontWeight = FontWeight.Medium, fontStyle = FontStyle.Italic)
}
