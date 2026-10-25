# ephemeral

A simple Deno script for temporarily hosting anything (limited to 32KiB, for at
most 24 hours).

## Development

```sh
deno task dev
```

This runs the server locally on http://localhost:8000 with file watching.

## Deploying

Runs on the shared EC2 box at `ephemeral.w3x.io`, deployed on every push to
`master`. Setup and operation: [`deploy/README.md`](deploy/README.md).
