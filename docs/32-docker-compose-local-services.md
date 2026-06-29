# Docker Compose Local Services

The Compose file is:

```text
deployments/docker-compose.yml
```

## Common Commands

```bash
make openfga/up
make openfga/model-test
make openfga/seed
make server-openfga
make openfga/down
```

## Tools Container

Tool targets run in a Node container with the repo mounted at `/workspace`.

```bash
make shell
```

## OpenFGA State

The local OpenFGA service uses an in-memory datastore. If you restart it,
reseed:

```bash
make openfga/seed
```
