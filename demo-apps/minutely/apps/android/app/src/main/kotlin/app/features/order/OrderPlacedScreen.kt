package app.features.order

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.R
import app.core.designsystem.AmountRow
import app.core.designsystem.AppCard
import app.core.designsystem.AppTextStyles
import app.core.designsystem.AppTheme
import app.core.designsystem.Artwork
import app.core.designsystem.EmptyState
import app.core.designsystem.IconCircle
import app.core.designsystem.PrimaryButton
import app.features.cart.CartLine
import app.features.catalog.LocalCatalogRepository
import app.features.catalog.categoryTint
import app.generated.AppConfig
import app.generated.AppIconSize
import app.generated.AppIcons
import app.generated.AppRadius
import app.generated.AppSpacing
import app.generated.AppTypography

@Composable
fun OrderPlacedScreen(viewModel: OrderPlacedViewModel, onBack: () -> Unit, onContinueShopping: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    OrderPlacedContent(state = state, onBack = onBack, onContinueShopping = onContinueShopping)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderPlacedContent(state: OrderPlacedUiState, onBack: () -> Unit, onContinueShopping: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.order_title), style = AppTextStyles.titleBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(AppIcons.back, contentDescription = stringResource(R.string.common_back))
                    }
                },
            )
        },
    ) { padding ->
        when (state) {
            OrderPlacedUiState.Loading -> Unit
            OrderPlacedUiState.NotFound -> EmptyState(
                icon = AppIcons.receipt,
                title = stringResource(R.string.order_not_found_title),
                body = stringResource(R.string.order_not_found_body),
                actionLabel = stringResource(R.string.order_continue_shopping),
                actionTag = "order.continueShopping",
                onAction = onContinueShopping,
                modifier = Modifier.padding(padding).testTag("order.notFound"),
            )
            is OrderPlacedUiState.Found -> Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = AppSpacing.lg, vertical = AppSpacing.md),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
            ) {
                Hero(state.order)
                StatusCard()
                SummaryCard(state.order)
                PrimaryButton(
                    text = stringResource(R.string.order_continue_shopping),
                    onClick = onContinueShopping,
                    modifier = Modifier.fillMaxWidth().testTag("order.continueShopping"),
                )
                Spacer(Modifier.height(AppSpacing.md))
            }
        }
    }
}

@Composable
private fun Hero(order: Order) {
    val scale = remember { Animatable(0.4f) }
    LaunchedEffect(Unit) {
        scale.animateTo(1f, spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMediumLow))
    }
    Column(
        modifier = Modifier.fillMaxWidth().padding(top = AppSpacing.lg),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
    ) {
        // A soft halo around the check, in primary at low emphasis.
        Box(
            modifier = Modifier
                .scale(scale.value)
                .size(112.dp)
                .background(AppTheme.colors.primary.copy(alpha = 0.14f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            IconCircle(
                icon = AppIcons.orderPlaced,
                background = AppTheme.colors.primary,
                tint = AppTheme.colors.onPrimary,
                size = 84.dp,
                iconSize = AppIconSize.lg * 1.4f,
            )
        }
        Spacer(Modifier.height(AppSpacing.sm))
        Text(stringResource(R.string.order_placed_title), style = AppTypography.headline, color = AppTheme.colors.onBackground, textAlign = TextAlign.Center)
        Text(
            stringResource(R.string.order_placed_body, AppConfig.deliveryMinutes),
            style = AppTypography.body,
            color = AppTheme.colors.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(AppSpacing.xs))
        Surface(shape = RoundedCornerShape(AppRadius.full), color = AppTheme.colors.surfaceVariant, contentColor = AppTheme.colors.onSurface) {
            Text(
                stringResource(R.string.order_number, order.id),
                style = AppTextStyles.labelBold,
                modifier = Modifier.padding(horizontal = AppSpacing.lg, vertical = AppSpacing.sm).testTag("order.number"),
            )
        }
    }
}

private enum class StepState { Done, Current, Pending }

@Composable
private fun StatusCard() {
    val steps = listOf(
        R.string.order_step_confirmed to StepState.Done,
        R.string.order_step_packing to StepState.Current,
        R.string.order_step_on_the_way to StepState.Pending,
        R.string.order_step_delivered to StepState.Pending,
    )
    AppCard {
        Text(stringResource(R.string.order_tracking_title), style = AppTextStyles.titleBold)
        Spacer(Modifier.height(AppSpacing.xs))
        Column {
            steps.forEachIndexed { index, (label, stepState) ->
                TimelineStep(
                    label = stringResource(label),
                    state = stepState,
                    isFirst = index == 0,
                    isLast = index == steps.lastIndex,
                    lineAboveDone = index > 0 && steps[index - 1].second == StepState.Done,
                    lineBelowDone = stepState == StepState.Done,
                )
            }
        }
    }
}

@Composable
private fun TimelineStep(label: String, state: StepState, isFirst: Boolean, isLast: Boolean, lineAboveDone: Boolean, lineBelowDone: Boolean) {
    val colors = AppTheme.colors
    val dot = 24.dp
    Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
        Column(Modifier.width(dot).fillMaxHeight(), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.width(2.dp).height(AppSpacing.sm).background(if (isFirst) Color.Transparent else if (lineAboveDone) colors.primary else colors.outline))
            when (state) {
                StepState.Done -> IconCircle(AppIcons.check, colors.primary, colors.onPrimary, size = dot, iconSize = AppIconSize.sm)
                StepState.Current -> Box(
                    Modifier.size(dot).border(BorderStroke(3.dp, colors.primary), CircleShape).padding(6.dp).background(colors.primary, CircleShape),
                )
                StepState.Pending -> Box(Modifier.size(dot).border(BorderStroke(2.dp, colors.outline), CircleShape))
            }
            Box(Modifier.width(2.dp).weight(1f).background(if (isLast) Color.Transparent else if (lineBelowDone) colors.primary else colors.outline))
        }
        Text(
            label,
            style = if (state == StepState.Current) AppTextStyles.labelBold else AppTypography.label,
            color = if (state == StepState.Pending) colors.onSurfaceVariant else colors.onSurface,
            modifier = Modifier.padding(top = AppSpacing.sm + 2.dp, bottom = AppSpacing.lg),
        )
    }
}

@Composable
private fun SummaryCard(order: Order) {
    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(stringResource(R.string.order_summary_title), style = AppTextStyles.titleBold, modifier = Modifier.weight(1f))
            Text(
                pluralStringResource(R.plurals.common_item_count, order.itemCount, order.itemCount),
                style = AppTypography.label,
                color = AppTheme.colors.onSurfaceVariant,
            )
        }
        order.lines.forEach { line ->
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = AppSpacing.xs).testTag("order.line.${line.productId}"),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
            ) {
                Artwork(line.emoji, categoryTint(line.categoryId), Modifier.size(44.dp), emojiSize = 24.sp, radius = AppRadius.sm)
                Column(Modifier.weight(1f)) {
                    Text(
                        stringResource(R.string.order_line_quantity, line.name, line.quantity),
                        style = AppTypography.label,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(line.unit, style = AppTypography.caption, color = AppTheme.colors.onSurfaceVariant)
                }
                Text(stringResource(R.string.common_price, line.lineTotal), style = AppTextStyles.price)
            }
        }
        HorizontalDivider(color = AppTheme.colors.outline)
        AmountRow(stringResource(R.string.order_total), labelStyle = AppTextStyles.price) {
            Text(stringResource(R.string.common_price, order.toPay), style = AppTextStyles.price, modifier = Modifier.testTag("order.total"))
        }
    }
}

private fun previewOrder(): Order =
    Order.place(listOf(CartLine("banana", 2), CartLine("milk", 1)), LocalCatalogRepository(), placedAt = 1761800123456)

@Preview(heightDp = 1200)
@Composable
private fun OrderPlacedScreenPreview() {
    AppTheme(darkTheme = false) {
        OrderPlacedContent(OrderPlacedUiState.Found(previewOrder()), {}, {})
    }
}

@Preview(heightDp = 1200)
@Composable
private fun OrderPlacedDarkPreview() {
    AppTheme(darkTheme = true) {
        OrderPlacedContent(OrderPlacedUiState.Found(previewOrder()), {}, {})
    }
}

@Preview
@Composable
private fun OrderNotFoundPreview() {
    AppTheme(darkTheme = false) {
        OrderPlacedContent(OrderPlacedUiState.NotFound, {}, {})
    }
}
