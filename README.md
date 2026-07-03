# ephemeral

A simple Deno script for temporarily hosting anything (limited to 32KiB).

## Development

```sh
deno task dev
```

This runs the server locally on http://localhost:8000 with file watching.

## Deploying

This app targets the new [Deno Deploy](https://console.deno.com). Either:

- **GitHub integration** — connect this repository from the Deno Deploy
  dashboard; builds run automatically on push (no GitHub Actions config needed).
  The entrypoint (`index.tsx`) is configured in `deno.json`.
- **CLI** — deploy with the `deno deploy` subcommand (replaces the deprecated
  `deployctl`).
