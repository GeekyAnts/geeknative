package app.features.auth

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import app.core.Timestamps
import app.core.storage.DataStoreKeyValueStore
import app.core.storage.InMemoryKeyValueStore
import app.core.storage.KeyValueStore
import app.core.storage.StorageJson
import java.security.MessageDigest
import java.time.Clock
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer

/** The signed-in member. */
data class Account(val name: String, val email: String, val createdAt: String)

enum class AuthError { EmailTaken, InvalidCredentials }

class AuthException(val error: AuthError) : Exception(error.name)

/** Accounts and the session. Screens use whichever implementation AppContainer provides. */
interface AuthRepository {
    /** The signed-in member, or null when signed out. */
    val account: Flow<Account?>

    suspend fun currentAccount(): Account?

    /** Creates an account and signs it in. Throws [AuthException] with [AuthError.EmailTaken]. */
    suspend fun signUp(name: String, email: String, password: String): Account

    /** Throws [AuthException] with [AuthError.InvalidCredentials]. */
    suspend fun signIn(email: String, password: String): Account

    suspend fun signOut()
}

@Serializable
internal data class StoredAccount(val name: String, val email: String, val passwordHash: String, val createdAt: String)

/** Accounts under `auth.accounts` (JSON array) and the session's email under `auth.session`. */
open class KeyValueAuthRepository(private val store: KeyValueStore, private val clock: Clock) : AuthRepository {
    private val mutex = Mutex()
    private val serializer = ListSerializer(StoredAccount.serializer())

    override val account: Flow<Account?> =
        combine(store.observe(SESSION_KEY), store.observe(ACCOUNTS_KEY)) { session, accounts ->
            session?.let { email -> decode(accounts).firstOrNull { it.email == email }?.toAccount() }
        }.distinctUntilChanged()

    override suspend fun currentAccount(): Account? = account.first()

    override suspend fun signUp(name: String, email: String, password: String): Account = mutex.withLock {
        val normalized = normalizeEmail(email)
        val accounts = decode(store.read(ACCOUNTS_KEY))
        if (accounts.any { it.email == normalized }) throw AuthException(AuthError.EmailTaken)
        val stored = StoredAccount(
            name = name.trim(),
            email = normalized,
            passwordHash = passwordHash(normalized, password),
            createdAt = Timestamps.now(clock),
        )
        store.write(ACCOUNTS_KEY, StorageJson.encodeToString(serializer, accounts + stored))
        store.write(SESSION_KEY, normalized)
        stored.toAccount()
    }

    override suspend fun signIn(email: String, password: String): Account = mutex.withLock {
        val normalized = normalizeEmail(email)
        val stored = decode(store.read(ACCOUNTS_KEY)).firstOrNull { it.email == normalized }
        if (stored == null || stored.passwordHash != passwordHash(normalized, password)) {
            throw AuthException(AuthError.InvalidCredentials)
        }
        store.write(SESSION_KEY, normalized)
        stored.toAccount()
    }

    override suspend fun signOut() {
        store.write(SESSION_KEY, null)
    }

    private fun decode(text: String?): List<StoredAccount> =
        text?.let { runCatching { StorageJson.decodeFromString(serializer, it) }.getOrNull() } ?: emptyList()

    private fun StoredAccount.toAccount() = Account(name = name, email = email, createdAt = createdAt)

    companion object {
        const val ACCOUNTS_KEY = "auth.accounts"
        const val SESSION_KEY = "auth.session"

        fun normalizeEmail(email: String): String = email.trim().lowercase()

        /** Lowercase hex SHA-256 of the UTF-8 string "<email>:<password>". */
        fun passwordHash(email: String, password: String): String =
            MessageDigest.getInstance("SHA-256")
                .digest("$email:$password".toByteArray(Charsets.UTF_8))
                .joinToString("") { "%02x".format(it) }
    }
}

class DataStoreAuthRepository(dataStore: DataStore<Preferences>, clock: Clock) :
    KeyValueAuthRepository(DataStoreKeyValueStore(dataStore), clock)

class InMemoryAuthRepository(clock: Clock, val store: InMemoryKeyValueStore = InMemoryKeyValueStore()) :
    KeyValueAuthRepository(store, clock)
