# Docker Fundamentals

Docker gives this repo a repeatable Node toolchain, server runtime, and local
OpenFGA service.

## Dockerfile Stages

```text
dev      Node image for tool commands
deps     installs npm dependencies
build    builds the server
runtime  minimal Node runtime running dist/server/index.js
```

## Make Targets

The repo uses:

```text
make -> docker compose -> containerized tools
```

Examples:

```bash
make install
make test
make check
make server
```

Local npm commands also work if your Node version matches `package.json`.

## Runtime Port

The app listens on port 4001 by default.
