SHELL := /bin/sh

COMPOSE_MENU ?= false
export COMPOSE_MENU

COMPOSE ?= docker compose -f deployments/docker-compose.yml
NODE_TOOLS := $(COMPOSE) --profile tools run --rm --build tools
APP        := $(COMPOSE) --profile app
FGA_CLI    := docker run --rm -v "$(CURDIR):/workspace" -w /workspace openfga/cli:v0.7.16

.DEFAULT_GOAL := help

.PHONY: help install build test trace test-permission typecheck lint audit format-check security-audit check shell server server-down server-openfga \
        openfga/up openfga/down openfga/model-test openfga/seed compose/config clean

help:
	@printf '%s\n' 'ReBAC Primer - TypeScript implementation'
	@printf '%s\n' ''
	@printf '%s\n' '3 Musketeers workflow: make -> docker compose -> containerized tools'
	@printf '%s\n' ''
	@printf '%s\n' 'TypeScript:'
	@printf '%s\n' '  make install        Install npm dependencies in the tools container'
	@printf '%s\n' '  make build          Build the Node server bundle'
	@printf '%s\n' '  make test           Run Vitest tests'
	@printf '%s\n' '  make trace          Print the Alice can_edit graph traversal'
	@printf '%s\n' '  make test-permission Run one representative permission test'
	@printf '%s\n' '  make typecheck      Run tsc --noEmit'
	@printf '%s\n' '  make lint           Run ESLint'
	@printf '%s\n' '  make audit          Check make*/compose* factory naming'
	@printf '%s\n' '  make format-check   Check Prettier formatting'
	@printf '%s\n' '  make security-audit Run npm audit'
	@printf '%s\n' '  make check          Format, typecheck, lint, tests, and build'
	@printf '%s\n' '  make shell          Open shell in the Node tools container'
	@printf '%s\n' '  make server         Run the app on http://127.0.0.1:4001'
	@printf '%s\n' ''
	@printf '%s\n' 'OpenFGA:'
	@printf '%s\n' '  make openfga/up     Start local OpenFGA'
	@printf '%s\n' '  make openfga/down   Stop local OpenFGA'
	@printf '%s\n' '  make openfga/model-test Test the model with the pinned fga CLI container'
	@printf '%s\n' '  make openfga/seed   Create store, write model, seed tuples'
	@printf '%s\n' '  make server-openfga Run app with AUTHZ_BACKEND=openfga'
	@printf '%s\n' ''
	@printf '%s\n' 'Cleanup:'
	@printf '%s\n' '  make clean          Remove containers, volumes, and build output'

install:
	$(NODE_TOOLS) npm install

build:
	$(NODE_TOOLS) npm run build

test:
	$(NODE_TOOLS) npm test

trace:
	$(NODE_TOOLS) npm run trace

test-permission:
	$(NODE_TOOLS) npm run test:permission

typecheck:
	$(NODE_TOOLS) npm run typecheck

lint:
	$(NODE_TOOLS) npm run lint

audit:
	$(NODE_TOOLS) npm run audit

format-check:
	$(NODE_TOOLS) npm run format:check

security-audit:
	$(NODE_TOOLS) npm run security:audit

check:
	$(NODE_TOOLS) npm run check

shell:
	$(NODE_TOOLS) sh

server:
	$(APP) up --build app

server-down:
	$(APP) down

server-openfga:
	@test -f deployments/openfga/.ids.env || { echo "Run 'make openfga/up && make openfga/seed' first."; exit 1; }
	set -a; . deployments/openfga/.ids.env; set +a; \
	AUTHZ_BACKEND=openfga OPENFGA_API_URL=http://openfga:8080 $(APP) up --build app

openfga/up:
	$(COMPOSE) up -d openfga

openfga/down:
	$(COMPOSE) down

openfga/model-test:
	$(FGA_CLI) model test --tests deployments/openfga/model.fga.yaml

openfga/seed:
	deployments/openfga/seed.sh

compose/config:
	$(COMPOSE) --profile app --profile tools config

clean:
	$(COMPOSE) --profile app --profile tools down --volumes --remove-orphans
	rm -rf dist coverage node_modules
