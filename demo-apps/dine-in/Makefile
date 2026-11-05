# Framework commands (doctor, gen, check, run-*, parity) come from geeknative.
include .geeknative/framework.mk

.DEFAULT_GOAL := help

# Add your own targets below.

.PHONY: assets check-assets

assets: ## Copy the demo catalog and the serif display font from contracts/ into each app
	@node scripts/assets.mjs

check-assets: ## Fail if an app's copy of the catalog or display font is out of date
	@node scripts/assets.mjs --check
