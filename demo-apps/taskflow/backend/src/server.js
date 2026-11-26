import { createApp } from './app.js'
import { config } from './config.js'
import { openDatabase } from './db.js'
import { seedTasks } from './seed.js'
import { TaskStore } from './task-store.js'

const store = new TaskStore(openDatabase(config.databasePath))
if (store.count() === 0) {
  console.log(`Seeded ${seedTasks(store)} tasks into ${config.databasePath}`)
}

const app = createApp({ store, openApiPath: config.openApiPath, log: true })
app.listen(config.port, () => {
  console.log(`Taskflow API on http://127.0.0.1:${config.port} (OpenAPI at /openapi.json)`)
})
