package app.core.designsystem

import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import app.R
import app.features.catalog.TravelCategory
import app.features.catalog.icon
import app.generated.AppElevation
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSize
import app.generated.AppSpacing
import app.generated.AppTypography
import androidx.compose.foundation.shape.RoundedCornerShape

@Composable
fun SearchField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    testTag: String,
    modifier: Modifier = Modifier,
    onSearch: (() -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth().testTag(testTag),
        placeholder = { Text(placeholder) },
        leadingIcon = {
            Icon(
                AppIcons.search,
                contentDescription = stringResource(R.string.common_search),
                modifier = Modifier.size(AppIconSize.md),
            )
        },
        singleLine = true,
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        keyboardActions = KeyboardActions(onSearch = { onSearch?.invoke() }),
        shape = RoundedCornerShape(AppRadius.lg),
    )
}

@Composable
fun CategoryChipRow(
    selectedIds: Set<String>,
    onSelect: (TravelCategory) -> Unit,
    testTagPrefix: String,
    modifier: Modifier = Modifier,
    padded: Boolean = true,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .then(if (padded) Modifier.padding(horizontal = AppSpacing.lg) else Modifier),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
    ) {
        TravelCategory.entries.forEach { category ->
            val selected = category.id in selectedIds
            FilterChip(
                selected = selected,
                onClick = { onSelect(category) },
                label = { Text(stringResource(category.label)) },
                leadingIcon = {
                    Icon(category.icon(), contentDescription = null, modifier = Modifier.size(AppIconSize.sm))
                },
                modifier = Modifier.testTag(
                    when (testTagPrefix) {
                        "home.category" -> "home.category.${category.id}"
                        "explore.category" -> "explore.category.${category.id}"
                        "planner.interest" -> "planner.interest.${category.id}"
                        "profile.interest" -> "profile.interest.${category.id}"
                        else -> "$testTagPrefix.${category.id}"
                    },
                ),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = AppTheme.colors.primary,
                    selectedLabelColor = AppTheme.colors.onPrimary,
                    selectedLeadingIconColor = AppTheme.colors.onPrimary,
                ),
            )
        }
    }
}

@Composable
fun BudgetBandRow(
    selected: String,
    onSelect: (String) -> Unit,
    testTagPrefix: String,
    modifier: Modifier = Modifier,
) {
    val bands = listOf(
        "value" to R.string.budget_value,
        "mid" to R.string.budget_mid,
        "luxury" to R.string.budget_luxury,
    )
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm),
    ) {
        bands.forEach { (id, label) ->
            FilterChip(
                selected = selected == id,
                onClick = { onSelect(id) },
                label = { Text(stringResource(label)) },
                modifier = Modifier.testTag(
                    when (testTagPrefix) {
                        "planner.budget" -> "planner.budget.$id"
                        "profile.budget" -> "profile.budget.$id"
                        else -> "$testTagPrefix.$id"
                    },
                ),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = AppTheme.colors.primary,
                    selectedLabelColor = AppTheme.colors.onPrimary,
                ),
            )
        }
    }
}

@Composable
fun TravelersStepper(
    count: Int,
    onChange: (Int) -> Unit,
    testTag: String,
    @StringRes label: Int,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth().testTag(testTag),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(stringResource(label), style = AppTypography.body)
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(
                onClick = { onChange((count - 1).coerceAtLeast(1)) },
                modifier = Modifier.size(AppSize.touchTarget),
                enabled = count > 1,
            ) {
                Icon(
                    AppIcons.chevronDown,
                    contentDescription = stringResource(R.string.common_decrease),
                    modifier = Modifier.size(AppIconSize.md),
                )
            }
            Text(stringResource(R.string.planner_travelers_value, count.toString()), style = AppTypography.title)
            IconButton(
                onClick = { onChange((count + 1).coerceAtMost(8)) },
                modifier = Modifier.size(AppSize.touchTarget),
                enabled = count < 8,
            ) {
                Icon(
                    AppIcons.plus,
                    contentDescription = stringResource(R.string.common_increase),
                    modifier = Modifier.size(AppIconSize.md),
                )
            }
        }
    }
}

@Composable
fun PrimaryActionButton(
    text: String,
    onClick: () -> Unit,
    testTag: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val shape = RoundedCornerShape(AppRadius.lg)
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .fillMaxWidth()
            .height(AppSize.touchTarget)
            .shadow(AppElevation.high, shape)
            .testTag(testTag),
        shape = shape,
        contentPadding = ControlContentPadding,
        elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp, 0.dp, 0.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = AppTheme.colors.primary,
            contentColor = AppTheme.colors.onPrimary,
        ),
    ) {
        Text(text)
    }
}

@Composable
fun CatalogError(
    title: String,
    body: String,
    onRetry: (() -> Unit)?,
    modifier: Modifier = Modifier,
    testTag: String? = null,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(AppSpacing.lg)
            .then(if (testTag != null) Modifier.testTag(testTag) else Modifier),
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(title, style = AppTypography.title)
        Text(body, style = AppTypography.body, color = AppTheme.colors.onSurfaceVariant)
        if (onRetry != null) {
            Button(onClick = onRetry, contentPadding = ControlContentPadding) {
                Text(stringResource(R.string.common_retry))
            }
        }
    }
}

@Composable
fun InitialsAvatar(name: String, modifier: Modifier = Modifier) {
    val initials = name
        .split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .map { it.first().uppercaseChar() }
        .joinToString("")
        .ifEmpty { name.take(1).uppercase() }
    androidx.compose.foundation.layout.Box(
        modifier.size(AppSize.thumb).background(AppTheme.colors.primary, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(initials, style = AppTypography.headline, color = AppTheme.colors.onPrimary)
    }
}
