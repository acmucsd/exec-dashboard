ENV_FILE ?= .env.compose

COMPOSE_BASE = docker compose --env-file $(ENV_FILE) -f docker-compose.yml
COMPOSE_BUILD = docker compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.build.yml

.DEFAULT_GOAL := help

.PHONY: help check-env up up-local down logs reset-db config config-build

help: ## Show available commands
	@printf "Exec Dashboard local workflow\n\n"
	@printf "Usage: make <target> [ENV_FILE=.env.compose]\n\n"
	@printf "Targets:\n"
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

check-env: ## Validate required env files exist
	@test -f "$(ENV_FILE)" || (printf "Missing %s\n" "$(ENV_FILE)" && exit 1)
	@test -f "backend/.env" || (printf "Missing backend/.env\n" && exit 1)
	@set -a; . "$(ENV_FILE)"; set +a; test -f "$${KARTANA_ENV_FILE:-../kartana/.env}" || (printf "Missing %s\n" "$${KARTANA_ENV_FILE:-../kartana/.env}" && exit 1)
	@set -a; . "$(ENV_FILE)"; set +a; test -f "$${MEMBERSHIP_PORTAL_ENV_FILE:-../membership-portal/.env}" || (printf "Missing %s\n" "$${MEMBERSHIP_PORTAL_ENV_FILE:-../membership-portal/.env}" && exit 1)

up: check-env ## Rebuild exec images; run remote Kartana/Membership Portal images
	$(COMPOSE_BASE) up -d --build

up-local: check-env ## Rebuild local images for exec, Kartana, and Membership Portal
	$(COMPOSE_BUILD) up -d --build

down: ## Stop stack and remove orphan containers
	$(COMPOSE_BASE) down --remove-orphans

logs: ## Tail logs for all services
	$(COMPOSE_BASE) logs -f

reset-db: ## Remove local Postgres data directory
	rm -rf ./.docker-data/postgres
	mkdir -p ./.docker-data/postgres

config: ## Validate base compose configuration
	$(COMPOSE_BASE) config

config-build: ## Validate build-mode compose configuration
	$(COMPOSE_BUILD) config
