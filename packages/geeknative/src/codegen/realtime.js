// @ts-check
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { assertIdentifier, banner, OUT } from './util.js'

const SOURCE = 'contracts/realtime.json'
const FLAG = 'realtimeEnabled'
const FIELD_TYPES = ['string', 'int', 'boolean']

/**
 * @typedef {'string' | 'int' | 'boolean'} FieldType
 * @typedef {{ name: string, type: FieldType }} Field
 * @typedef {{ name: string, fields: Field[] }} RealtimeEvent
 * @typedef {{ url: string, auth: 'none' | 'bearer', heartbeatMs: number, initialMs: number, maxMs: number, factor: number, events: RealtimeEvent[] }} RealtimeContract
 * @typedef {{ initialMs: number, maxMs: number, factor: number }} ReconnectPolicy
 */

/**
 * Delay before reconnect attempt `attempt` (0 is the first retry). The wait is the base delay
 * plus or minus a quarter, so the three generated clients share one formula.
 * @param {number} attempt
 * @param {ReconnectPolicy} policy
 * @param {() => number} [random] 0 to 1
 */
export function backoffDelay(attempt, policy, random = Math.random) {
  const base = Math.min(policy.maxMs, policy.initialMs * policy.factor ** attempt)
  const jitter = base * 0.25
  return Math.round(base - jitter + random() * jitter * 2)
}

/**
 * @param {string} root
 * @param {import('./config.js').Config} config
 * @returns {{ path: string, content: string }[]}
 */
export function realtimeOutputs(root, config) {
  const file = path.join(root, SOURCE)
  const enabled = flagValues(config)
  if (!existsSync(file)) {
    if (enabled.some(Boolean)) {
      throw new CliError(
        `${SOURCE} is missing, but ${FLAG} is true in contracts/config.json. Create the realtime contract, or set ${FLAG} to false in every environment.`,
      )
    }
    return []
  }
  const contract = readContract(root, config)
  if (!enabled.some(Boolean)) return []
  assertAndroidReady(root)
  return [
    { path: `${OUT.iosGenerated}/RealtimeClient.swift`, content: swift(contract) },
    { path: `${OUT.androidKotlin}/RealtimeClient.kt`, content: kotlin(contract) },
    { path: `${OUT.webGenerated}/realtime.ts`, content: typescript(contract) },
  ]
}

/** @param {import('./config.js').Config} config */
function flagValues(config) {
  const value = config.values[FLAG]
  if (!value) return []
  if (value.type !== 'boolean') {
    throw new CliError(`contracts/config.json values.${FLAG} must be type "boolean".`)
  }
  return config.environments.map((env) => value.perEnv[env] === true)
}

/**
 * @param {string} root
 * @param {import('./config.js').Config} config
 * @returns {RealtimeContract}
 */
function readContract(root, config) {
  const raw = readJson(path.join(root, SOURCE), SOURCE)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new CliError(`${SOURCE} must be an object.`)
  }
  const allowed = new Set(['url', 'enabled', 'auth', 'heartbeatMs', 'reconnect', 'events'])
  for (const key of Object.keys(raw)) {
    if (key.startsWith('$') || allowed.has(key)) continue
    throw new CliError(`${SOURCE} has "${key}", which realtime contracts do not use.`)
  }
  const url = /** @type {any} */ (raw).url
  if (typeof url !== 'string' || !config.values[url] || config.values[url].type !== 'url') {
    throw new CliError(`${SOURCE} "url" must name a type "url" value in contracts/config.json.`)
  }
  if (/** @type {any} */ (raw).enabled !== FLAG) {
    throw new CliError(`${SOURCE} "enabled" must be "${FLAG}".`)
  }
  if (!config.values[FLAG] || config.values[FLAG].type !== 'boolean') {
    throw new CliError(`contracts/config.json values.${FLAG} must be a boolean. The realtime contract turns the socket on per environment.`)
  }
  const auth = /** @type {any} */ (raw).auth
  if (auth !== 'none' && auth !== 'bearer') throw new CliError(`${SOURCE} "auth" must be "none" or "bearer".`)
  const heartbeatMs = positiveInt(/** @type {any} */ (raw).heartbeatMs, `${SOURCE} "heartbeatMs"`)
  const reconnect = /** @type {any} */ (raw).reconnect
  if (!reconnect || typeof reconnect !== 'object' || Array.isArray(reconnect)) {
    throw new CliError(`${SOURCE} "reconnect" must be an object with initialMs, maxMs and factor.`)
  }
  const initialMs = positiveInt(reconnect.initialMs, `${SOURCE} reconnect.initialMs`)
  const maxMs = positiveInt(reconnect.maxMs, `${SOURCE} reconnect.maxMs`)
  if (maxMs < initialMs) throw new CliError(`${SOURCE} reconnect.maxMs must be at least initialMs.`)
  const factor = positiveInt(reconnect.factor, `${SOURCE} reconnect.factor`)
  if (factor < 2) throw new CliError(`${SOURCE} reconnect.factor must be an integer greater than 1.`)
  return { url, auth, heartbeatMs, initialMs, maxMs, factor, events: readEvents(/** @type {any} */ (raw).events) }
}

/** @param {unknown} value @param {string} where */
function positiveInt(value, where) {
  if (!Number.isInteger(value) || /** @type {number} */ (value) < 1) {
    throw new CliError(`${where} must be a whole number, 1 or more.`)
  }
  return /** @type {number} */ (value)
}

/** @param {unknown} raw @returns {RealtimeEvent[]} */
function readEvents(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new CliError(`${SOURCE} "events" must be an object.`)
  /** @type {RealtimeEvent[]} */
  const events = []
  for (const [name, entry] of Object.entries(raw)) {
    assertIdentifier(name, `${SOURCE} event`)
    const where = `${SOURCE} events.${name}`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new CliError(`${where} must be an object.`)
    for (const key of Object.keys(entry)) {
      if (key === 'id' || key === 'fields') continue
      throw new CliError(`${where} has "${key}". An event has "id" and "fields".`)
    }
    if (/** @type {any} */ (entry).id !== 'string') throw new CliError(`${where} "id" must be "string". That field is the resume id.`)
    const fields = /** @type {any} */ (entry).fields
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new CliError(`${where} "fields" must be an object.`)
    /** @type {Field[]} */
    const parsed = []
    for (const [field, type] of Object.entries(fields)) {
      assertIdentifier(field, `${where} field`)
      if (field === 'id' || field === 'type') throw new CliError(`${where} field "${field}" is reserved by the envelope.`)
      if (!FIELD_TYPES.includes(/** @type {string} */ (type))) {
        throw new CliError(`${where} fields.${field} must be "string", "int" or "boolean".`)
      }
      parsed.push({ name: field, type: /** @type {FieldType} */ (type) })
    }
    parsed.sort((a, b) => (a.name < b.name ? -1 : 1))
    events.push({ name, fields: parsed })
  }
  events.sort((a, b) => (a.name < b.name ? -1 : 1))
  return events
}

/** @param {string} root */
function assertAndroidReady(root) {
  const android = path.join(root, 'apps', 'android')
  if (!existsSync(android)) return
  const gradle = [path.join(android, 'gradle', 'libs.versions.toml'), path.join(android, 'app', 'build.gradle.kts')]
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  if (!/okhttp/i.test(gradle)) {
    throw new CliError(
      `${SOURCE} is enabled, but the Android app has no OkHttp dependency. Add it to apps/android/gradle/libs.versions.toml and app/build.gradle.kts.`,
    )
  }
  const manifest = path.join(android, 'app', 'src', 'main', 'AndroidManifest.xml')
  const text = existsSync(manifest) ? readFileSync(manifest, 'utf8') : ''
  if (!text.includes('android.permission.INTERNET')) {
    throw new CliError(`${SOURCE} is enabled, but AndroidManifest.xml is missing the android.permission.INTERNET permission.`)
  }
}

/** @param {FieldType} type */
const swiftType = (type) => (type === 'string' ? 'String' : type === 'int' ? 'Int' : 'Bool')
/** @param {FieldType} type */
const kotlinType = (type) => (type === 'string' ? 'String' : type === 'int' ? 'Int' : 'Boolean')
/** @param {FieldType} type */
const tsType = (type) => (type === 'string' ? 'string' : type === 'int' ? 'number' : 'boolean')

/** @param {RealtimeContract} contract */
function swift(contract) {
  const cases = contract.events
    .map((event) => {
      const params = [`id: String`, ...event.fields.map((field) => `${field.name}: ${swiftType(field.type)}`)].join(', ')
      return `    case ${event.name}(${params})`
    })
    .join('\n')
  const decode = contract.events
    .map((event) => {
      const reads = event.fields
        .map((field) => `guard let ${field.name} = ${swiftRead(field)} else { return }`)
        .join('\n            ')
      const args = ['id: id', ...event.fields.map((field) => `${field.name}: ${field.name}`)].join(', ')
      return `        case ${JSON.stringify(event.name)}:
            guard let id = object["id"] as? String else { return }
            ${reads}
            remember(id)
            continuation.yield(.${event.name}(${args}))`
    })
    .join('\n')
  const auth = contract.auth === 'bearer'
  return `// ${banner(SOURCE)}
import Foundation

/// Connection state shared with the Android and web clients.
nonisolated enum RealtimeState: String, Sendable {
    case disconnected, connecting, connected, reconnecting
}

/// One decoded server event. Unknown envelope types are ignored.
nonisolated enum RealtimeEvent: Sendable, Equatable {
${cases.length ? cases : '    case unused'}
}

/// The app's WebSocket. Screens do not construct this. A repository owns it, and AppContainer chooses the live one.
/// Text frames only. \`connect()\` does nothing when AppConfig.${FLAG} is false.
nonisolated final class RealtimeClient: @unchecked Sendable {
    private let token: @Sendable () -> String?
    private let lock = NSLock()
    private var state: RealtimeState = .disconnected
    private var socket: URLSessionWebSocketTask?
    private var loops: [Task<Void, Never>] = []
    private var attempt = 0
    private var lastId: String?
    private var userDisconnected = false
    private var awaitingPong = false
    private let continuation: AsyncStream<RealtimeEvent>.Continuation
    let events: AsyncStream<RealtimeEvent>

    init(token: @escaping @Sendable () -> String? = { nil }) {
        self.token = token
        var created: AsyncStream<RealtimeEvent>.Continuation!
        events = AsyncStream { created = $0 }
        continuation = created
    }

    func currentState() -> RealtimeState {
        lock.lock()
        defer { lock.unlock() }
        return state
    }

    func connect() {
        lock.lock()
        defer { lock.unlock() }
        guard AppConfig.${FLAG} else { return }
        guard state == .disconnected else { return }
        userDisconnected = false
        state = .connecting
        openLocked()
    }

    func disconnect() {
        lock.lock()
        userDisconnected = true
        lastId = nil
        state = .disconnected
        let socket = self.socket
        let loops = self.loops
        self.socket = nil
        self.loops = []
        lock.unlock()
        loops.forEach { $0.cancel() }
        socket?.cancel(with: .goingAway, reason: nil)
    }

    /// Drop the connection and keep lastId, so the next active call can resume.
    func appDidEnterBackground() {
        lock.lock()
        userDisconnected = true
        state = .disconnected
        let socket = self.socket
        let loops = self.loops
        self.socket = nil
        self.loops = []
        lock.unlock()
        loops.forEach { $0.cancel() }
        socket?.cancel(with: .goingAway, reason: nil)
    }

    func appDidBecomeActive() {
        lock.lock()
        let idle = state == .disconnected
        lock.unlock()
        if idle { connect() }
    }

    func networkDidReturn() {
        appDidBecomeActive()
    }

    private func openLocked() {
        let socket = URLSession.shared.webSocketTask(with: AppConfig.${contract.url})
        self.socket = socket
        socket.resume()
        loops = [
            Task { await handshake(socket) },
            Task { await receive(socket) },
            Task { await heartbeat(socket) },
        ]
    }

    private func handshake(_ socket: URLSessionWebSocketTask) async {
        ${auth ? `if let token = token(), !token.isEmpty {
            try? await socket.send(.string("{\\"type\\":\\"auth\\",\\"token\\":\\"\\(jsonString(token))\\"}"))
        }` : ''}
        let resume = lastId
        if let resume {
            try? await socket.send(.string("{\\"type\\":\\"resume\\",\\"lastId\\":\\"\\(jsonString(resume))\\"}"))
        }
        lock.lock()
        if self.socket === socket { state = .connected }
        lock.unlock()
    }

    private func receive(_ socket: URLSessionWebSocketTask) async {
        while !Task.isCancelled {
            do {
                let message = try await socket.receive()
                if case .string(let text) = message { handle(text) }
            } catch {
                closed(socket)
                return
            }
        }
    }

    private func heartbeat(_ socket: URLSessionWebSocketTask) async {
        let interval = UInt64(${contract.heartbeatMs}) * 1_000_000
        while !Task.isCancelled {
            try? await Task.sleep(nanoseconds: interval)
            if Task.isCancelled { return }
            lock.lock()
            let missed = awaitingPong
            awaitingPong = true
            lock.unlock()
            if missed {
                socket.cancel(with: .goingAway, reason: nil)
                return
            }
            try? await socket.send(.string("{\\"type\\":\\"ping\\"}"))
        }
    }

    private func handle(_ text: String) {
        guard let data = text.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = object["type"] as? String else { return }
        switch type {
        case "pong":
            lock.lock()
            awaitingPong = false
            lock.unlock()
        case "error":
            if object["code"] as? String == "unauthorized" {
                socket?.cancel(with: .goingAway, reason: nil)
            }
${decode}
        default:
            break
        }
    }

    private func remember(_ id: String) {
        lock.lock()
        lastId = id
        lock.unlock()
    }

    private func closed(_ socket: URLSessionWebSocketTask) {
        lock.lock()
        guard self.socket === socket else { lock.unlock(); return }
        self.socket = nil
        let loops = self.loops
        self.loops = []
        let stop = userDisconnected
        if stop {
            state = .disconnected
            lock.unlock()
            loops.forEach { $0.cancel() }
            return
        }
        state = .reconnecting
        let wait = delay(attempt)
        attempt += 1
        lock.unlock()
        loops.forEach { $0.cancel() }
        Task {
            try? await Task.sleep(nanoseconds: UInt64(wait * 1_000_000_000))
            self.lock.lock()
            guard self.state == .reconnecting, !self.userDisconnected else { self.lock.unlock(); return }
            self.state = .connecting
            self.openLocked()
            self.lock.unlock()
        }
    }

    /// Base delay times factor^attempt, capped, then plus or minus a quarter.
    private func delay(_ attempt: Int) -> Double {
        let base = min(Double(${contract.maxMs}), Double(${contract.initialMs}) * pow(Double(${contract.factor}), Double(attempt)))
        let jitter = base * 0.25
        return (base - jitter + Double.random(in: 0...(jitter * 2))) / 1000
    }

    private func jsonString(_ value: String) -> String {
        value.replacingOccurrences(of: "\\\\", with: "\\\\\\\\").replacingOccurrences(of: "\\"", with: "\\\\\\"")
    }
}
`
}

/** @param {Field} field */
function swiftRead(field) {
  if (field.type === 'string') return `object[${JSON.stringify(field.name)}] as? String`
  if (field.type === 'boolean') return `object[${JSON.stringify(field.name)}] as? Bool`
  return `object[${JSON.stringify(field.name)}] as? Int ?? (object[${JSON.stringify(field.name)}] as? NSNumber)?.intValue`
}

/** @param {RealtimeContract} contract */
function kotlin(contract) {
  const variants = contract.events
    .map((event) => {
      const params = [`val id: String`, ...event.fields.map((field) => `val ${field.name}: ${kotlinType(field.type)}`)].join(', ')
      return `    data class ${pascal(event.name)}(${params}) : RealtimeEvent()`
    })
    .join('\n')
  const decode = contract.events
    .map((event) => {
      const args = [`id = json.getString("id")`, ...event.fields.map((field) => `${field.name} = ${kotlinRead(field)}`)].join(', ')
      return `            "${event.name}" -> {\n                remember(json.getString("id"))\n                _events.tryEmit(RealtimeEvent.${pascal(event.name)}(${args}))\n            }`
    })
    .join('\n')
  const auth = contract.auth === 'bearer'
  return `// ${banner(SOURCE)}
package app.generated

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.math.min
import kotlin.math.pow
import kotlin.random.Random
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject

/** Connection state shared with the iOS and web clients. */
enum class RealtimeState { Disconnected, Connecting, Connected, Reconnecting }

/** One decoded server event. Unknown envelope types are ignored. */
sealed class RealtimeEvent {
${variants.length ? variants : '    data object Unused : RealtimeEvent()'}
}

/**
 * The app's WebSocket. Screens do not construct this. A repository owns it, and AppContainer chooses the live one.
 * Text frames only. [connect] does nothing when [AppConfig.${FLAG}] is false.
 */
class RealtimeClient(private val token: suspend () -> String? = { null }) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val http = OkHttpClient()
    private val _state = MutableStateFlow(RealtimeState.Disconnected)
    val state: StateFlow<RealtimeState> = _state.asStateFlow()
    private val _events = MutableSharedFlow<RealtimeEvent>(extraBufferCapacity = 64)
    val events: SharedFlow<RealtimeEvent> = _events.asSharedFlow()
    private var socket: WebSocket? = null
    private var jobs: List<Job> = emptyList()
    private var attempt = 0
    private var lastId: String? = null
    private var userDisconnected = false
    private var awaitingPong = false

    fun connect() {
        if (!AppConfig.${FLAG}) return
        if (_state.value != RealtimeState.Disconnected) return
        userDisconnected = false
        _state.value = RealtimeState.Connecting
        open()
    }

    fun disconnect() {
        userDisconnected = true
        lastId = null
        _state.value = RealtimeState.Disconnected
        jobs.forEach { it.cancel() }
        jobs = emptyList()
        socket?.close(1000, "disconnect")
        socket = null
    }

    /** Drop the connection and keep lastId, so the next active call can resume. */
    fun appDidEnterBackground() {
        userDisconnected = true
        _state.value = RealtimeState.Disconnected
        jobs.forEach { it.cancel() }
        jobs = emptyList()
        socket?.close(1000, "background")
        socket = null
    }

    fun appDidBecomeActive() {
        if (_state.value == RealtimeState.Disconnected) connect()
    }

    fun networkDidReturn() {
        appDidBecomeActive()
    }

    private fun open() {
        val request = Request.Builder().url(AppConfig.${contract.url}).build()
        socket = http.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                jobs += scope.launch { handshake(webSocket) }
                jobs += scope.launch { heartbeat(webSocket) }
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handle(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(code, reason)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                closed(webSocket)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                closed(webSocket)
            }
        })
    }

    private suspend fun handshake(webSocket: WebSocket) {
        ${auth ? `val token = token()
        if (!token.isNullOrEmpty()) webSocket.send("{\\"type\\":\\"auth\\",\\"token\\":\\"\${jsonString(token)}\\"}")` : ''}
        lastId?.let { webSocket.send("{\\"type\\":\\"resume\\",\\"lastId\\":\\"\${jsonString(it)}\\"}") }
        if (socket === webSocket) _state.value = RealtimeState.Connected
    }

    private suspend fun heartbeat(webSocket: WebSocket) {
        while (true) {
            delay(${contract.heartbeatMs}.toLong())
            if (awaitingPong) {
                webSocket.close(1001, "pong")
                return
            }
            awaitingPong = true
            webSocket.send("{\\"type\\":\\"ping\\"}")
        }
    }

    private fun handle(text: String) {
        val json = try { JSONObject(text) } catch (_: Throwable) { return }
        when (json.optString("type")) {
            "pong" -> awaitingPong = false
            "error" -> if (json.optString("code") == "unauthorized") socket?.close(1008, "unauthorized")
${decode}
        }
    }

    private fun remember(id: String) {
        lastId = id
    }

    private fun closed(webSocket: WebSocket) {
        if (socket !== webSocket) return
        socket = null
        jobs.forEach { it.cancel() }
        jobs = emptyList()
        if (userDisconnected) {
            _state.value = RealtimeState.Disconnected
            return
        }
        _state.value = RealtimeState.Reconnecting
        val wait = delay(attempt)
        attempt += 1
        scope.launch {
            delay(wait)
            if (_state.value != RealtimeState.Reconnecting || userDisconnected) return@launch
            _state.value = RealtimeState.Connecting
            open()
        }
    }

    /** Base delay times factor^attempt, capped, then plus or minus a quarter. Milliseconds. */
    private fun delay(attempt: Int): Long {
        val base = min(${contract.maxMs}.toDouble(), ${contract.initialMs}.toDouble() * ${contract.factor}.toDouble().pow(attempt))
        val jitter = base * 0.25
        return (base - jitter + Random.nextDouble() * jitter * 2).toLong()
    }

    private fun jsonString(value: String) = value.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"")
}
`
}

/** @param {Field} field */
function kotlinRead(field) {
  if (field.type === 'string') return `json.getString("${field.name}")`
  if (field.type === 'int') return `json.getInt("${field.name}")`
  return `json.getBoolean("${field.name}")`
}

/** @param {string} name */
function pascal(name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** @param {RealtimeContract} contract */
function typescript(contract) {
  const members = contract.events
    .map((event) => {
      const fields = [`id: string`, ...event.fields.map((field) => `${field.name}: ${tsType(field.type)}`)].join('; ')
      return `  | { type: ${JSON.stringify(event.name)}; ${fields} }`
    })
    .join('\n')
  const decode = contract.events
    .map((event) => {
      const checks = event.fields.map((field) => `payload.${field.name} !== undefined`).join(' && ')
      const guard = checks ? `payload.id !== undefined && ${checks}` : `payload.id !== undefined`
      return `      case ${JSON.stringify(event.name)}: {
        if (${guard}) {
          this.lastId = String(payload.id)
          const event = payload as RealtimeEvent
          this.listeners.forEach((listener) => listener(event))
        }
        break
      }`
    })
    .join('\n')
  const auth = contract.auth === 'bearer'
  return `// ${banner(SOURCE)}
import { AppConfig } from './config'

/** Connection state shared with the iOS and Android clients. */
export type RealtimeState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

/** One decoded server event. Unknown envelope types are ignored. */
export type RealtimeEvent =
${members.length ? members : '  | { type: "unused" }'}

/**
 * The app's WebSocket. Screens do not construct this. A repository owns it, and AppContainer chooses the live one.
 * Text frames only. connect() does nothing when AppConfig.${FLAG} is false.
 * The socket is created inside connect(), never when this module loads, so server rendering does not open one.
 */
export class RealtimeClient {
  private token: () => Promise<string | null>
  private socket: WebSocket | undefined
  private stateValue: RealtimeState = 'disconnected'
  private attempt = 0
  private lastId: string | undefined
  private userDisconnected = false
  private awaitingPong = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private listeners = new Set<(event: RealtimeEvent) => void>()

  constructor(token: () => Promise<string | null> = async () => null) {
    this.token = token
  }

  get state(): RealtimeState {
    return this.stateValue
  }

  connect(): void {
    if (!AppConfig.${FLAG}) return
    if (this.stateValue !== 'disconnected') return
    this.userDisconnected = false
    this.stateValue = 'connecting'
    this.open()
  }

  disconnect(): void {
    this.userDisconnected = true
    this.lastId = undefined
    this.stop('disconnected')
  }

  /** Drop the connection and keep lastId, so the next active call can resume. */
  appDidEnterBackground(): void {
    this.userDisconnected = true
    this.stop('disconnected')
  }

  appDidBecomeActive(): void {
    if (this.stateValue === 'disconnected') this.connect()
  }

  networkDidReturn(): void {
    this.appDidBecomeActive()
  }

  subscribe(listener: (event: RealtimeEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async *events(): AsyncGenerator<RealtimeEvent> {
    const queue: RealtimeEvent[] = []
    let wake: (() => void) | undefined
    const stop = this.subscribe((event) => {
      queue.push(event)
      wake?.()
      wake = undefined
    })
    try {
      while (true) {
        if (queue.length === 0) await new Promise<void>((resolve) => { wake = resolve })
        const event = queue.shift()
        if (event) yield event
      }
    } finally {
      stop()
    }
  }

  private open(): void {
    if (typeof WebSocket === 'undefined') return
    const socket = new WebSocket(AppConfig.${contract.url})
    this.socket = socket
    socket.addEventListener('open', () => { void this.handshake(socket) })
    socket.addEventListener('message', (message) => {
      if (typeof message.data === 'string') this.handle(message.data)
    })
    socket.addEventListener('close', () => this.closed(socket))
  }

  private async handshake(socket: WebSocket): Promise<void> {
    ${auth ? `const token = await this.token()
    if (token) socket.send(JSON.stringify({ type: 'auth', token }))` : ''}
    if (this.lastId) socket.send(JSON.stringify({ type: 'resume', lastId: this.lastId }))
    if (this.socket === socket) this.stateValue = 'connected'
    this.armHeartbeat(socket)
  }

  private armHeartbeat(socket: WebSocket): void {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      if (this.awaitingPong) {
        socket.close()
        return
      }
      this.awaitingPong = true
      socket.send(JSON.stringify({ type: 'ping' }))
      this.armHeartbeat(socket)
    }, ${contract.heartbeatMs})
  }

  private handle(text: string): void {
    let payload: { type?: string; code?: string; id?: unknown }
    try {
      payload = JSON.parse(text) as { type?: string; code?: string; id?: unknown }
    } catch {
      return
    }
    switch (payload.type) {
      case 'pong':
        this.awaitingPong = false
        break
      case 'error':
        if (payload.code === 'unauthorized') this.socket?.close()
        break
${decode}
      default:
        break
    }
  }

  private closed(socket: WebSocket): void {
    if (this.socket !== socket) return
    this.socket = undefined
    clearTimeout(this.timer)
    if (this.userDisconnected) {
      this.stateValue = 'disconnected'
      return
    }
    this.stateValue = 'reconnecting'
    const wait = this.delay(this.attempt)
    this.attempt += 1
    this.timer = setTimeout(() => {
      if (this.stateValue !== 'reconnecting' || this.userDisconnected) return
      this.stateValue = 'connecting'
      this.open()
    }, wait)
  }

  private stop(next: RealtimeState): void {
    clearTimeout(this.timer)
    this.socket?.close()
    this.socket = undefined
    this.stateValue = next
  }

  /** Base delay times factor^attempt, capped, then plus or minus a quarter. Milliseconds. */
  private delay(attempt: number): number {
    const base = Math.min(${contract.maxMs}, ${contract.initialMs} * ${contract.factor} ** attempt)
    const jitter = base * 0.25
    return Math.round(base - jitter + Math.random() * jitter * 2)
  }
}
`
}
