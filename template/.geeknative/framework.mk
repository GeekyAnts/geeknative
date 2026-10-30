# Managed by geeknative: replaced on upgrade. Add your own targets to the root Makefile.

GEEKNATIVE ?= ./node_modules/.bin/geeknative
# `make check ENV=staging` builds the staging environment from contracts/config.json.
ENV_PREFIX = $(if $(ENV),GEEKNATIVE_ENV=$(ENV) )

.PHONY: help doctor gen font check check-contracts check-ios check-android check-web lint parity run-ios run-android run-web

help: ## List the commands
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  make %-16s %s\n", $$1, $$2}'

doctor: ## Check toolchains (FIX=1 installs what it can)
	@$(GEEKNATIVE) doctor $(if $(FIX),--fix)

gen: ## Regenerate app code from contracts/
	@$(GEEKNATIVE) gen

font: ## Switch the shared typeface (FAMILY="Open Sans" from Google Fonts, or FAMILY=system)
	@$(GEEKNATIVE) font $(FAMILY)

check: ## Validate contracts, then build and test all three apps
	@$(ENV_PREFIX)$(GEEKNATIVE) check all

check-contracts: ## Validate contracts and check generated code is current
	@$(GEEKNATIVE) check contracts

check-ios: ## Build and test the iOS app
	@$(ENV_PREFIX)$(GEEKNATIVE) check ios

check-android: ## Build and test the Android app
	@$(ENV_PREFIX)$(GEEKNATIVE) check android

check-web: ## Type-check, test and build the web app
	@$(ENV_PREFIX)$(GEEKNATIVE) check web

parity: ## Update spec/parity.md from feature specs and tests
	@$(GEEKNATIVE) parity

lint: ## Find hardcoded text, unknown test IDs, centered titles and stale specs (make check runs it too)
	@$(GEEKNATIVE) lint

run-ios: ## Build and launch the iOS app in a simulator
	@$(ENV_PREFIX)$(GEEKNATIVE) run ios

run-android: ## Build and launch the Android app on an emulator or device
	@$(ENV_PREFIX)$(GEEKNATIVE) run android

run-web: ## Start the web dev server
	@$(ENV_PREFIX)$(GEEKNATIVE) run web
