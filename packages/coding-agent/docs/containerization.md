# Containerization

TRPI runs with all permissions by default, but in some cases, you will want to have more control over what directories TRPI can write to and which accesses it has.

There are two general options. You can either
1. run the whole `trpi` process inside an isolated environment, or
2. run `trpi` on the host and route tool execution into an isolated environment.

## Choose a pattern

| Pattern | What is isolated | Best for | Notes |
| --- | --- | --- | --- |
| Gondolin extension | Built-in tools and `!` commands | Local micro-VM isolation while keeping auth on host | See [`examples/extensions/gondolin/`](../examples/extensions/gondolin/). |
| Plain Docker | Whole `trpi` process in a local container | Simple local isolation | Provider API keys enter the container. |
| OpenShell | Whole `trpi` process in a policy-controlled sandbox | Local or remote managed sandbox | Requires an OpenShell gateway |

Extensions run wherever the `trpi` process runs. If you run host TRPI with a tool-routing extension, other custom extension tools still run on the host unless they also delegate their operations.

## Gondolin

[Gondolin](https://github.com/earendil-works/gondolin) is a local Linux micro-VM.
Use the [example extension](../examples/extensions/gondolin) when you want TRPI on the host but all built-in tools routed into the VM.

Setup:

```bash
cp -R packages/coding-agent/examples/extensions/gondolin ~/.trpi/agent/extensions/gondolin
cd ~/.trpi/agent/extensions/gondolin
npm install --ignore-scripts
```

Run from the project you want mounted:

```bash
cd /path/to/project
trpi -e ~/.trpi/agent/extensions/gondolin
```

The extension mounts the host cwd at `/workspace` in the VM and overrides `read`, `write`, `edit`, `bash`, `grep`, `find`, and `ls`.
User `!` commands are routed into the VM, as well.
File changes under `/workspace` write through to the host.

Requirements: Node.js >= 23.6.0 for `@earendil-works/gondolin`, plus QEMU (requires installation through your package manager).

## Plain Docker

Run the whole `trpi` process in Docker when you want the simplest local container boundary.

`Dockerfile.trpi`:

```dockerfile
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
  && rm -rf /var/lib/apt/lists/*

ARG TRPI_REF=main
RUN git clone https://github.com/Lore-Hex/trpi.git /opt/trpi \
  && git -C /opt/trpi checkout "$TRPI_REF" \
  && npm --prefix /opt/trpi ci --ignore-scripts \
  && npm --prefix /opt/trpi run hydrate:model-data \
  && npm --prefix /opt/trpi run build:offline \
  && ln -s /opt/trpi/packages/coding-agent/dist/cli.js /usr/local/bin/trpi

WORKDIR /workspace
ENTRYPOINT ["trpi"]
```

Build and run:

```bash
docker build -t trpi-local -f Dockerfile.trpi .

docker run --rm -it \
  -e TRUSTEDROUTER_API_KEY \
  -v "$PWD:/workspace" \
  -v trpi-agent-home:/root/.trpi/agent \
  trpi-local
```

The `-v "$PWD:/workspace"` mounts your current directory into the container at /workspace such that reads and writes in `/workspace` inside Docker directly affect your host files, like in the Gondolin example.

Use a named volume for `/root/.trpi/agent` if you want container-local settings and sessions. Mounting your host `~/.trpi/agent` exposes host auth and session files to the container.

## OpenShell

Use [NVIDIA OpenShell](https://docs.nvidia.com/openshell/about/overview) when you want a policy-controlled sandbox with filesystem, process, network, credential, and inference controls.
OpenShell can run sandboxes through a local gateway backed by Docker, Podman, or a VM runtime, or through a remote Kubernetes gateway.

Every sandbox requires an active gateway.
Register and select one before creating a sandbox:

```bash
openshell gateway add <gateway-url> --name <name>
openshell gateway select <name>
```

Build or otherwise provide an image containing TRPI, such as the `trpi-local` image above, then launch it inside an OpenShell sandbox:

```bash
openshell sandbox create --name trpi-sandbox --from trpi-local -- trpi
```

In this pattern, the whole `trpi` process runs inside the sandbox.
Built-in tools, `!` commands, and extension tools execute inside the OpenShell boundary.

If the gateway is remote, project files are not bind-mounted from the host, meaning writes in the sandbox are not reflected on your machine.
Clone the repository inside the sandbox or use OpenShell file transfer commands:

```bash
openshell sandbox upload trpi-sandbox ./repo /workspace
openshell sandbox download trpi-sandbox /workspace/repo ./repo-out
```

OpenShell providers can keep raw model API keys outside the sandbox.
When inference routing is configured, code inside the sandbox can call `https://inference.local`, and the gateway injects the configured provider credentials upstream.
Configure TRPI to use the corresponding OpenAI-compatible or Anthropic-compatible endpoint if you want model traffic to use this route.
