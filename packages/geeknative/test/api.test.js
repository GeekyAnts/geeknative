import assert from 'node:assert/strict'
import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { validateApi } from '../src/codegen/api.js'
import { generate } from '../src/codegen/index.js'
import { CliError } from '../src/lib/log.js'
import { editJson, outputOf, tempProject, writeJson } from './helpers.js'

const HN = {
  openapi: '3.1.0',
  info: { title: 'HN', version: '1.0.0' },
  paths: {
    '/stories': {
      get: {
        operationId: 'listStories',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Story' } },
              },
            },
          },
        },
      },
    },
    '/stories/{id}': {
      get: {
        operationId: 'getStory',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Story' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Story: {
        type: 'object',
        required: ['id', 'title'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          score: { type: 'integer' },
        },
      },
    },
  },
}

/** Writes one task file. Slices hold paths and schemas; make gen adds the OpenAPI envelope. */
function writeSlice(dir, name, api) {
  const folder = path.join(dir, 'contracts', 'api')
  mkdirSync(folder, { recursive: true })
  writeJson(path.join(folder, name), { paths: api.paths ?? {}, components: api.components ?? {} })
}

function projectWithApi(api = HN, name = 'stories.json') {
  const dir = tempProject()
  writeSlice(dir, name, api)
  editJson(path.join(dir, 'contracts', 'config.json'), (config) => {
    config.values = {
      apiBaseUrl: {
        type: 'url',
        description: 'Backend API.',
        development: 'http://localhost:8080',
        staging: 'https://staging.example.com',
        production: 'https://api.example.com',
      },
    }
  })
  return dir
}

test('missing contracts/api produces no API outputs', () => {
  const paths = generate(tempProject()).map((o) => o.path)
  assert.equal(paths.some((p) => p.includes('/api/') && (p.endsWith('.swift') || p.endsWith('.kt') || p.endsWith('.ts'))), false)
})

test('HN OpenAPI fixture generates Story models and list/get clients on every platform', () => {
  const outputs = generate(projectWithApi())

  const swiftModels = outputOf(outputs, 'api/Stories.swift')
  assert.match(swiftModels, /struct Story/)
  assert.match(swiftModels, /var id: String/)
  assert.match(swiftModels, /var score: Int\?/)

  const swiftClient = outputOf(outputs, 'api/Stories.swift')
  assert.match(swiftClient, /enum ApiStories/)
  assert.match(swiftClient, /static func listStories\(\) async throws -> \[Story\]/)
  assert.match(swiftClient, /static func getStory\(id: String\) async throws -> Story/)
  assert.match(outputOf(outputs, 'api/ApiTransport.swift'), /AppConfig\.apiBaseUrl/)
  assert.match(swiftClient, /ApiTransport\.encodePathSegment/)

  const kotlinModels = outputOf(outputs, 'api/Stories.kt')
  assert.match(kotlinModels, /data class Story/)
  assert.match(kotlinModels, /val id: String/)
  assert.match(kotlinModels, /val score: Long\? = null/)

  const kotlinClient = outputOf(outputs, 'api/Stories.kt')
  assert.match(kotlinClient, /object ApiStories/)
  assert.match(kotlinClient, /suspend fun listStories\(\): List<Story>/)
  assert.match(kotlinClient, /suspend fun getStory\(id: String\): Story/)
  assert.match(kotlinClient, /ApiTransport\.encodePathSegment/)
  assert.match(outputOf(outputs, 'api/ApiTransport.kt'), /AppConfig\.apiBaseUrl/)
  assert.match(outputOf(outputs, 'api/ApiTransport.kt'), /\.replace\("\+", "%20"\)/)

  const ts = outputOf(outputs, 'generated/api/stories.ts')
  assert.match(ts, /export type Story = \{/)
  assert.match(ts, /export async function listStories/)
  assert.match(ts, /export async function getStory/)
  assert.match(outputOf(outputs, 'generated/api/transport.ts'), /AppConfig\.apiBaseUrl/)
})

test('HTTP code lives in the shared transport, not in each operation', () => {
  const outputs = generate(projectWithApi())

  const swiftTransport = outputOf(outputs, 'api/ApiTransport.swift')
  assert.match(swiftTransport, /static func send\(method: String/)
  assert.match(swiftTransport, /URLSession\.shared\.data/)
  const swiftTask = outputOf(outputs, 'api/Stories.swift')
  assert.match(swiftTask, /ApiTransport\.send\(/)
  assert.equal(swiftTask.includes('URLSession'), false)

  const kotlinTransport = outputOf(outputs, 'api/ApiTransport.kt')
  assert.match(kotlinTransport, /suspend fun request\(/)
  assert.match(kotlinTransport, /HttpURLConnection/)
  const kotlinTask = outputOf(outputs, 'api/Stories.kt')
  assert.match(kotlinTask, /ApiTransport\.request\(/)
  assert.equal(kotlinTask.includes('HttpURLConnection'), false)

  const tsTransport = outputOf(outputs, 'generated/api/transport.ts')
  assert.match(tsTransport, /export async function request<T>/)
  assert.match(tsTransport, /await fetch\(/)
  const tsTask = outputOf(outputs, 'generated/api/stories.ts')
  assert.match(tsTask, /import \{ request \} from "\.\/transport"/)
  assert.equal(tsTask.includes('fetch('), false)
})

test('iOS path parameters are encoded once, with an ASCII-only set', () => {
  const transport = outputOf(generate(projectWithApi()), 'api/ApiTransport.swift')
  assert.match(transport, /components\.percentEncodedPath = basePath \+ suffix/)
  assert.equal(transport.includes('components.path ='), false)
  assert.match(transport, /CharacterSet\(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-\._~"\)/)
  assert.equal(transport.includes('CharacterSet.alphanumerics'), false)

  assert.throws(
    () => validateApi({ ...HN, paths: { '/my items': HN.paths['/stories'] } }),
    (error) => error instanceof CliError && /not valid in a URL path/.test(error.message),
  )
})

test('task files without apiBaseUrl generate models only', () => {
  const dir = tempProject()
  writeSlice(dir, 'stories.json', HN)
  const outputs = generate(dir)
  const paths = outputs.map((o) => o.path)
  assert.ok(paths.some((p) => p.endsWith('api/Stories.swift')))
  assert.ok(paths.some((p) => p.endsWith('api/Stories.kt')))
  assert.ok(paths.some((p) => p.endsWith('api/stories.ts')))
  assert.equal(paths.some((p) => p.includes('ApiTransport') || p.endsWith('transport.ts')), false)
  const ts = outputOf(outputs, 'generated/api/stories.ts')
  assert.match(ts, /export type Story = \{/)
  assert.equal(ts.includes('AppConfig.apiBaseUrl'), false)
  assert.equal(ts.includes('export async function listStories'), false)
})

test('missing operationId is rejected', () => {
  assert.throws(
    () =>
      validateApi({
        openapi: '3.1.0',
        info: { title: 'X', version: '1' },
        paths: { '/x': { get: { responses: { '200': { content: { 'application/json': { schema: { type: 'string' } } } } } } } },
      }),
    (error) => {
      assert.ok(error instanceof CliError)
      assert.match(error.message, /operationId/)
      return true
    },
  )
})

test('bad $ref is rejected', () => {
  assert.throws(
    () =>
      validateApi({
        openapi: '3.1.0',
        info: { title: 'X', version: '1' },
        paths: {
          '/x': {
            get: {
              operationId: 'getX',
              responses: {
                '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Missing' } } } },
              },
            },
          },
        },
        components: { schemas: {} },
      }),
    (error) => {
      assert.ok(error instanceof CliError)
      assert.match(error.message, /does not exist/)
      return true
    },
  )
})

test('oneOf is rejected', () => {
  assert.throws(
    () =>
      validateApi({
        openapi: '3.1.0',
        info: { title: 'X', version: '1' },
        components: {
          schemas: {
            Item: { type: 'object', properties: { value: { oneOf: [{ type: 'string' }, { type: 'integer' }] } } },
          },
        },
      }),
    (error) => {
      assert.ok(error instanceof CliError)
      assert.match(error.message, /oneOf/)
      return true
    },
  )
})

test('array path and query parameters are rejected', () => {
  assert.throws(
    () =>
      validateApi({
        openapi: '3.1.0',
        info: { title: 'X', version: '1' },
        paths: {
          '/x': {
            get: {
              operationId: 'listX',
              parameters: [{ name: 'tags', in: 'query', schema: { type: 'array', items: { type: 'string' } } }],
              responses: { '200': { content: { 'application/json': { schema: { type: 'string' } } } } },
            },
          },
        },
      }),
    (error) => {
      assert.ok(error instanceof CliError)
      assert.match(error.message, /no arrays/)
      return true
    },
  )
})

test('204 generates void clients and Kotlin integers are Long', () => {
  const dir = projectWithApi({
    openapi: '3.1.0',
    info: { title: 'X', version: '1' },
    paths: {
      '/items/{id}': {
        delete: {
          operationId: 'deleteItem',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': {} },
        },
      },
    },
    components: {
      schemas: {
        Item: {
          type: 'object',
          required: ['createdAt'],
          properties: { createdAt: { type: 'integer' } },
        },
      },
    },
  }, 'items.json')
  const outputs = generate(dir)
  assert.match(outputOf(outputs, 'api/Items.swift'), /throws -> Void/)
  assert.match(outputOf(outputs, 'api/Items.kt'), /suspend fun deleteItem\(id: String\): Unit/)
  assert.match(outputOf(outputs, 'generated/api/items.ts'), /Promise<void>/)
  assert.match(outputOf(outputs, 'api/Items.kt'), /val createdAt: Long/)
})

test('removing the task files stops producing API files', () => {
  const dir = projectWithApi()
  const withApi = generate(dir).map((o) => o.path)
  assert.ok(withApi.some((p) => p.endsWith('api/Stories.swift')))

  rmSync(path.join(dir, 'contracts', 'api'), { recursive: true })
  const withoutApi = generate(dir).map((o) => o.path)
  assert.equal(withoutApi.some((p) => p.includes('/api/')), false)
})

test('a shared schema in common.json is visible to a task file', () => {
  const dir = tempProject()
  writeSlice(dir, 'common.json', { components: { schemas: HN.components.schemas } })
  writeSlice(dir, 'stories.json', { paths: HN.paths })
  editJson(path.join(dir, 'contracts', 'config.json'), (config) => {
    config.values = {
      apiBaseUrl: {
        type: 'url',
        description: 'Backend API.',
        development: 'http://localhost:8080',
        staging: 'https://staging.example.com',
        production: 'https://api.example.com',
      },
    }
  })
  const outputs = generate(dir)
  assert.match(outputOf(outputs, 'api/Common.swift'), /struct Story/)
  assert.match(outputOf(outputs, 'api/Stories.swift'), /static func listStories\(\)/)
  assert.doesNotMatch(outputOf(outputs, 'api/Stories.swift'), /struct Story/)
  assert.match(outputOf(outputs, 'api/Stories.kt'), /suspend fun getStory/)
  assert.match(outputOf(outputs, 'generated/api/stories.ts'), /export async function listStories/)
  assert.match(outputOf(outputs, 'generated/api/stories.ts'), /from "\.\/common"/)
})

test('a single contracts/api.json is rejected', () => {
  const dir = tempProject()
  writeJson(path.join(dir, 'contracts', 'api.json'), HN)
  assert.throws(
    () => generate(dir),
    (error) => {
      assert.ok(error instanceof CliError)
      assert.match(error.message, /contracts\/api\.json is not a contract/)
      return true
    },
  )
})

test('two task files cannot define the same schema', () => {
  const dir = tempProject()
  const story = { components: { schemas: HN.components.schemas } }
  writeSlice(dir, 'posts.json', story)
  writeSlice(dir, 'feed.json', story)
  assert.throws(
    () => generate(dir),
    (error) => {
      assert.ok(error instanceof CliError)
      assert.match(error.message, /both define schema "Story"/)
      return true
    },
  )
})
