# croner-site

Source of [croner.56k.guru](https://croner.56k.guru), the documentation site for Croner in
[JavaScript/TypeScript](https://github.com/Hexagon/croner), [Rust](https://github.com/Hexagon/croner-rust),
[Python](https://github.com/Hexagon/croner-py), [.NET](https://github.com/Hexagon/croner-dotnet) and
[C++](https://github.com/Hexagon/croner-cpp). Built with a small Deno script (`scripts/build.ts`,
`scripts/layout.ts`): Markdown in, static HTML out.

All pages are committed in `src/`, and the site is built from the `main` branch of this repository alone.

- Shared by all implementations: overview, installation, pattern syntax, contributing and sponsorship.
- JavaScript only: usage, comparison and migration. These are also kept in
  [`docs/`](https://github.com/Hexagon/croner/tree/dev/docs) in the croner repository.
  `deno task sync [path to croner]` copies them from a croner checkout into `src/`, and sets
  `version` in `src/_data.json` (used for `$CRONER_VERSION` in pages) to croner's version (unless it is a prerelease).
  Review and commit the result.

How to bring changes in the five implementation repositories into the site is described in
[AGENTS.md](AGENTS.md).

## Building

Requires [Deno](https://deno.com) 2.

```sh
deno task serve   # rebuild on change, http://localhost:8000
deno task build   # to _site/
```

## Publishing

`.github/workflows/pages.yml` builds the site on pull requests, and builds and deploys it to GitHub
Pages on pushes to `main` (or when run manually on `main`).
