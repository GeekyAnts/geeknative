import { config } from './config.js'
import { openDatabase } from './db.js'
import { seedTasks } from './seed.js'
import { TaskStore } from './task-store.js'

const store = new TaskStore(openDatabase(config.databasePath))
console.log(`Reset ${config.databasePath} to ${seedTasks(store)} seed tasks.`)
