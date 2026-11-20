import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
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

function projectWithApi(api = HN) {
  const dir = tempProject()
  writeJson(path.join(dir, 'contracts', 'api.json'), api)
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

test('missing api.json produces no API outputs', () => {
  const paths = generate(tempProject()).map((o) => o.path)
  assert.equal(paths.some((p) => p.includes('ApiModels') || p.endsWith('api.ts')), false)
})

test('HN OpenAPI fixture generates Story models and list/get clients on every platform', () => {
  const outputs = generate(projectWithApi())

  const swiftModels = outputOf(outputs, 'ApiModels.swift')
  assert.match(swiftModels, /struct Story/)
  assert.match(swiftModels, /var id: String/)
  assert.match(swiftModels, /var score: Int\?/)

  const swiftClient = outputOf(outputs, 'ApiClient.swift')
  assert.match(swiftClient, /static func listStories\(\) async throws -> \[Story\]/)
  assert.match(swiftClient, /static func getStory\(id: String\) async throws -> Story/)
  assert.match(swiftClient, /AppConfig\.apiBaseUrl/)
  assert.match(swiftClient, /encodePathSegment/)

  const kotlinModels = outputOf(outputs, 'ApiModels.kt')
  assert.match(kotlinModels, /data class Story/)
  assert.match(kotlinModels, /val id: String/)
  assert.match(kotlinModels, /val score: Long\? = null/)

  const kotlinClient = outputOf(outputs, 'ApiClient.kt')
  assert.match(kotlinClient, /suspend fun listStories\(\): List<Story>/)
  assert.match(kotlinClient, /suspend fun getStory\(id: String\): Story/)
  assert.match(kotlinClient, /AppConfig\.apiBaseUrl/)
  assert.match(kotlinClient, /encodePathSegment/)
  assert.match(kotlinClient, /\.replace\("\+", "%20"\)/)

  const ts = outputOf(outputs, 'generated/api.ts')
  assert.match(ts, /export type Story = \{/)
  assert.match(ts, /export async function listStories/)
  assert.match(ts, /export async function getStory/)
  assert.match(ts, /AppConfig\.apiBaseUrl/)
})

test('api.json without apiBaseUrl generates models only', () => {
  const dir = tempProject()
  writeJson(path.join(dir, 'contracts', 'api.json'), HN)
  const outputs = generate(dir)
  const paths = outputs.map((o) => o.path)
  assert.ok(paths.some((p) => p.endsWith('ApiModels.swift')))
  assert.ok(paths.some((p) => p.endsWith('ApiModels.kt')))
  assert.ok(paths.some((p) => p.endsWith('api.ts')))
  assert.equal(paths.some((p) => p.endsWith('ApiClient.swift') || p.endsWith('ApiClient.kt')), false)
  const ts = outputOf(outputs, 'generated/api.ts')
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
  })
  const outputs = generate(dir)
  assert.match(outputOf(outputs, 'ApiClient.swift'), /throws -> Void/)
  assert.match(outputOf(outputs, 'ApiClient.kt'), /suspend fun deleteItem\(id: String\): Unit/)
  assert.match(outputOf(outputs, 'generated/api.ts'), /Promise<void>/)
  assert.match(outputOf(outputs, 'ApiModels.kt'), /val createdAt: Long/)
})

test('removing api.json stops producing API files', () => {
  const dir = projectWithApi()
  const withApi = generate(dir).map((o) => o.path)
  assert.ok(withApi.some((p) => p.endsWith('ApiModels.swift')))

  rmSync(path.join(dir, 'contracts', 'api.json'))
  const withoutApi = generate(dir).map((o) => o.path)
  assert.equal(withoutApi.some((p) => p.includes('ApiModels') || p.endsWith('api.ts')), false)
})
