// Writes a compile-probe contracts/api.json and apiBaseUrl into a project root.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const API_PROBE = {
  openapi: '3.1.0',
  info: { title: 'Probe', version: '1.0.0' },
  paths: {
    '/items/{id}': {
      get: {
        operationId: 'getItem',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Item' } },
            },
          },
        },
      },
      patch: {
        operationId: 'patchItem',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } },
        },
        responses: {
          '200': {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Item' } },
            },
          },
        },
      },
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
        required: ['id', 'createdAt'],
        properties: {
          id: { type: 'string' },
          createdAt: { type: 'integer' },
        },
      },
    },
  },
}

/** @param {string} root */
export function applyApiFixture(root) {
  writeFileSync(path.join(root, 'contracts', 'api.json'), `${JSON.stringify(API_PROBE, null, 2)}\n`)
  const configPath = path.join(root, 'contracts', 'config.json')
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  config.values = {
    ...(config.values ?? {}),
    apiBaseUrl: {
      type: 'url',
      description: 'Backend API.',
      development: 'http://127.0.0.1:8080',
      staging: 'https://staging.example.com',
      production: 'https://api.example.com',
    },
  }
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  applyApiFixture(path.resolve(process.argv[2] ?? '.'))
}
