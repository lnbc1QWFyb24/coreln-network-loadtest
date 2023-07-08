# CoreLN Network Loadtest CLI

A simple CLI for load testing a network of Core Lightning nodes by connecting to them via commando and doing some basic data fetching.

## Run a Load Test

You can use the pre built binary CLI:

```bash
./connections loadtest "path_to_connections_text_file"
```

The only argument to the `loadtest` command is a path to a file that contains a new line separated list of urls which contain the node connection details. See `./example.connections` for an example connections file.

## Building From Source

1. Install [Bun](https://bun.sh):

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Install the dependencies:

```bash
bun install
```

3. Build the binary:

```bash
bun run build
```
