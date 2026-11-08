# croner-site

Source of [croner.56k.guru](https://croner.56k.guru), the documentation site for Croner in
[JavaScript/TypeScript](https://github.com/Hexagon/croner), [Rust](https://github.com/Hexagon/croner-rust),
[Python](https://github.com/Hexagon/croner-py), [.NET](https://github.com/Hexagon/croner-dotnet) and
[C++](https://github.com/Hexagon/croner-cpp). Built with [Lume](https://lume.land) and
[Lumocs](https://github.com/Hexagon/lumocs).

All pages are committed in `src/`, and the site is built from the `main` branch of this repository alone.

- Shared by all implementations: overview, installation, pattern syntax, contributing and sponsorship.
- JavaScript only: usage, comparison and migration.

The site follows the five implementation repositories. `deno task upstream` lists what has changed in
each of them since the last sync (recorded in `upstream.json`); [AGENTS.md](AGENTS.md) describes how to
bring those changes into the site, as a pull request.

## Building

Requires [Deno](https://deno.com) 2.

```sh
deno task serve   # http://localhost:8000
deno task build   # to _site/
```

## Publishing

`.github/workflows/pages.yml` builds the site on pull requests, and builds and deploys it to GitHub
Pages on pushes to `main` (or when run manually on `main`).
