# Taskflow API

The REST backend all three apps talk to. Node.js, Express 5 and SQLite through Node's built-in `node:sqlite`, so there are no native modules to compile. It implements [contracts/api.json](../contracts/api.json) (OpenAPI 3.1), which is also served at `/openapi.json`.

## Run it

From the project root:

| Command | What it does |
|---|---|
| `make run-backend` | Starts the API on http://127.0.0.1:8080. The first start creates `backend/data/taskflow.db` and seeds 14 tasks. |
| `make seed-backend` | Resets the database to the seed tasks. |
| `make check-backend` | Runs the API tests, including a check that every operation in the contract is served and every response matches its schema. |
| `make android-reverse` | Forwards the emulator's `127.0.0.1:8080` to this machine, so the Android app's development URL works. |

Environment variables: `PORT` (default 8080) and `DATABASE_PATH` (default `backend/data/taskflow.db`).

## Endpoints

| Method | Path | operationId | Notes |
|---|---|---|---|
| GET | `/tasks?status=&priority=` | `listTasks` | Both filters optional. Open tasks first, then priority, due date, newest |
| POST | `/tasks` | `createTask` | `TaskInput`, returns 201 with the `TaskItem` |
| GET | `/tasks/{taskId}` | `getTask` | 404 with `ErrorResponse` when missing |
| PUT | `/tasks/{taskId}` | `updateTask` | Full replace; a missing `dueDate` clears it |
| PATCH | `/tasks/{taskId}/status` | `updateTaskStatus` | `{ "status": "done" }` |
| DELETE | `/tasks/{taskId}` | `deleteTask` | 204 |
| GET | `/health` | | Not in the contract: a liveness check for scripts |

Errors are `{ "code": "validation" | "notFound" | "internal", "message": "..." }` with status 400, 404 or 500. CORS allows any origin, because there are no cookies or credentials.

## Changing the API

Edit `contracts/api.json` first, run `make gen` to regenerate the iOS, Android and web clients, then update `src/app.js` and the tests here.
