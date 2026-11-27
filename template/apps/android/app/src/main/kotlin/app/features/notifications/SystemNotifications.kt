package app.features.notifications

import android.Manifest
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import app.MainActivity
import app.R
import java.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

private const val CHANNEL_ID = "reminders"
const val NOTIFICATION_ROUTE = "notification.route"

/** The route from the notification the user just tapped. Navigation consumes it once. */
object NotificationRoutes {
    private val pending = MutableStateFlow<String?>(null)
    val route: StateFlow<String?> = pending

    fun open(route: String?) {
        pending.value = route ?: ""
    }

    fun consume() {
        pending.value = null
    }
}

/** Posts a shade notification and cancels it. A future `deliverAt` is an alarm that posts the same notification. */
class SystemNotificationScheduler(private val context: Context) : NotificationScheduler {
    override fun schedule(notification: AppNotification) {
        val whenMs = notification.deliverAt?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() }
        val now = System.currentTimeMillis()
        if (whenMs != null && whenMs > now + 500) {
            val alarm = context.getSystemService(AlarmManager::class.java)
            alarm.set(AlarmManager.RTC_WAKEUP, whenMs, broadcast(notification))
            return
        }
        show(context, notification)
    }

    override fun cancel(id: String) {
        context.getSystemService(AlarmManager::class.java).cancel(broadcast(id))
        manager().cancel(id.hashCode())
    }

    override fun cancelAll() {
        manager().cancelAll()
    }

    private fun broadcast(notification: AppNotification): PendingIntent = broadcast(notification.id, notification)

    private fun broadcast(id: String, notification: AppNotification? = null): PendingIntent {
        val intent = Intent(context, NotificationAlarmReceiver::class.java)
            .putExtra("id", id)
            .putExtra("title", notification?.title)
            .putExtra("body", notification?.body)
            .putExtra("route", notification?.route)
        return PendingIntent.getBroadcast(
            context,
            id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun manager() = context.getSystemService(NotificationManager::class.java)

    companion object {
        fun show(context: Context, notification: AppNotification) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(CHANNEL_ID, "Reminders", NotificationManager.IMPORTANCE_DEFAULT)
                context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
            }
            val open = Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                .putExtra(NOTIFICATION_ROUTE, notification.route)
            val pending = PendingIntent.getActivity(
                context,
                notification.id.hashCode(),
                open,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Notification.Builder(context, CHANNEL_ID)
            } else {
                @Suppress("DEPRECATION")
                Notification.Builder(context)
            }
            val built = builder
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle(notification.title)
                .setContentText(notification.body)
                .setAutoCancel(true)
                .setContentIntent(pending)
                .build()
            context.getSystemService(NotificationManager::class.java).notify(notification.id.hashCode(), built)
        }
    }
}

interface NotificationScheduler {
    fun schedule(notification: AppNotification)
    fun cancel(id: String)
    fun cancelAll()
}

/** Alarm fired while the process was eligible to run. Shows the one notification the inbox scheduled. */
class NotificationAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getStringExtra("id") ?: return
        SystemNotificationScheduler.show(
            context,
            AppNotification(
                id = id,
                kind = "reminder",
                title = intent.getStringExtra("title").orEmpty(),
                body = intent.getStringExtra("body").orEmpty(),
                createdAt = "",
                route = intent.getStringExtra("route"),
            ),
        )
    }
}

/** True when this process may post a notification. API 33+ needs the runtime permission. */
fun canPostNotifications(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < 33) return true
    return context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED
}
