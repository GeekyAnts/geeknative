# Managed by geeknative: replaced on upgrade. Add your own targets to the root Makefile.

GEEKNATIVE ?= ./node_modules/.bin/geeknative

.PHONY: help doctor gen check check-contracts check-ios check-android check-web parity run-ios run-android run-web

help: ## List the commands
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  make %-16s %s\n", $$1, $$2}'

doctor: ## Check toolchains (FIX=1 installs what it can)
	@$(GEEKNATIVE) doctor $(if $(FIX),--fix)

gen: ## Regenerate app code from contracts/
	@$(GEEKNATIVE) gen

check: ## Validate contracts, then build and test all three apps
	@$(GEEKNATIVE) check all

check-contracts: ## Validate contracts and check generated code is current
	@$(GEEKNATIVE) check contracts

check-ios: ## Build and test the iOS app
	@$(GEEKNATIVE) check ios

check-android: ## Build and test the Android app
	@$(GEEKNATIVE) check android

check-web: ## Type-check, test and build the web app
	@$(GEEKNATIVE) check web

parity: ## Update spec/parity.md from feature specs and tests
	@$(GEEKNATIVE) parity

run-ios: ## Build and launch the iOS app in a simulator
	@$(GEEKNATIVE) run ios

run-android: ## Build and launch the Android app on an emulator or device
	@$(GEEKNATIVE) run android

run-web: ## Start the web dev server
	@$(GEEKNATIVE) run web
