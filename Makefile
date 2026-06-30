SHELL := /bin/sh

COMPOSE_MENU ?= false
export COMPOSE_MENU

COMPOSE ?= docker compose -f deployments/docker-compose.yml
NODE_TOOLS := $(COMPOSE) --profile tools run --rm --build tools
APP        := $(COMPOSE) --profile app
FGA_CLI    := docker run --rm -v "$(CURDIR):/workspace" -w /workspace openfga/cli:v0.7.16

.DEFAULT_GOAL := help

.PHONY: help install build test trace test-permission typecheck lint audit format-check security-audit check ci shell server server-down server-openfga \
        openfga/up openfga/down openfga/model-test openfga/seed compose/config clean

help: ## Show this help
	@printf '%s\n' 'ReBAC Primer - TypeScript implementation'
	@printf '%s\n' '3 Musketeers workflow: make -> docker compose -> containerized tools'
	@printf '%s\n\n' ''
	@grep -hE '^[a-zA-Z0-9_/-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install npm dependencies in the tools container
	$(NODE_TOOLS) npm install

build: ## Build the Node server bundle
	$(NODE_TOOLS) npm run build

test: ## Run Vitest tests
	$(NODE_TOOLS) npm test

trace: ## Print the Alice can_edit graph traversal
	$(NODE_TOOLS) npm run trace

test-permission: ## Run one representative permission test
	$(NODE_TOOLS) npm run test:permission

typecheck: ## Run tsc --noEmit
	$(NODE_TOOLS) npm run typecheck

lint: ## Run ESLint
	$(NODE_TOOLS) npm run lint

audit: ## Check make*/compose* factory naming
	$(NODE_TOOLS) npm run audit

format-check: ## Check Prettier formatting
	$(NODE_TOOLS) npm run format:check

security-audit: ## Run npm audit
	$(NODE_TOOLS) npm run security:audit

check: ## Format-check, typecheck, lint, tests, and build
	$(NODE_TOOLS) npm run check

ci: install format-check typecheck lint audit security-audit test build ## Everything CI runs, from a clean checkout

shell: ## Open shell in the Node tools container
	$(NODE_TOOLS) sh

server: ## Run the app on http://127.0.0.1:4001
	$(APP) up --build app

server-down: ## Stop the app container
	$(APP) down

server-openfga: ## Run app with AUTHZ_BACKEND=openfga
	@test -f deployments/openfga/.ids.env || { echo "Run 'make openfga/up && make openfga/seed' first."; exit 1; }
	set -a; . deployments/openfga/.ids.env; set +a; \
	AUTHZ_BACKEND=openfga OPENFGA_API_URL=http://openfga:8080 $(APP) up --build app

openfga/up: ## Start local OpenFGA
	$(COMPOSE) up -d openfga

openfga/down: ## Stop local OpenFGA
	$(COMPOSE) down

openfga/model-test: ## Test the model with the pinned fga CLI container
	$(FGA_CLI) model test --tests deployments/openfga/model.fga.yaml

openfga/seed: ## Create store, write model, seed tuples
	deployments/openfga/seed.sh

compose/config: ## Render the merged Compose config
	$(COMPOSE) --profile app --profile tools config

clean: ## Remove containers, volumes, and build output
	$(COMPOSE) --profile app --profile tools down --volumes --remove-orphans
	rm -rf dist coverage node_modules
