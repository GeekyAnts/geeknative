# Framework commands (doctor, gen, check, run-*, parity) come from geeknative.
include .geeknative/framework.mk

.DEFAULT_GOAL := help

# Add your own targets below.

.PHONY: run-backend seed-backend check-backend android-reverse

run-backend: ## Start the Taskflow API on http://127.0.0.1:8080 (seeds on first run)
	@npm start --workspace backend

seed-backend: ## Reset the Taskflow database to the seed tasks
	@npm run seed --workspace backend

check-backend: ## Test the Taskflow API against contracts/api.json
	@npm test --workspace backend

android-reverse: ## Let the Android emulator reach the API at 127.0.0.1:8080
	@"$${ANDROID_HOME:-$$HOME/Library/Android/sdk}/platform-tools/adb" reverse tcp:8080 tcp:8080 && echo "adb reverse tcp:8080 -> host:8080"
