# Docker Networking

Docker Compose creates a private network for services.

```text
app      Node ReBAC server
openfga  OpenFGA API
tools    Node tool container
```

Inside Compose, the app reaches OpenFGA at:

```text
http://openfga:8080
```

From the host, OpenFGA is exposed at:

```text
http://127.0.0.1:8080
```

The Makefile sets `OPENFGA_API_URL=http://openfga:8080` for `server-openfga`
because that command runs the app inside the Compose network.
