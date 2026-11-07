# croner-site

Source of [croner.56k.guru](https://croner.56k.guru), the documentation site for Croner in
[JavaScript/TypeScript](https://github.com/Hexagon/croner), [Rust](https://github.com/Hexagon/croner-rust),
[Python](https://github.com/Hexagon/croner-py), [.NET](https://github.com/Hexagon/croner-dotnet) and
[C++](https://github.com/Hexagon/croner-cpp). Built with [Lume](https://lume.land) and
[Lumocs](https://github.com/Hexagon/lumocs).

- `src/` has the pages shared by all implementations: overview, installation, pattern syntax,
  contributing and sponsorship.
- The JavaScript pages (usage, comparison and migration) live in
  [`docs/`](https://github.com/Hexagon/croner/tree/dev/docs) in the croner repository.
  `deno task sync` copies them into `src/` (they are ignored by git here), and sets
  `$CRONER_VERSION` in `src/_data.json` to the version in croner's `package.json`.

## Building

Requires [Deno](https://deno.com) 2.

```sh
git clone https://github.com/Hexagon/croner ../croner   # or pass another path to sync
deno task sync
deno task serve   # http://localhost:8000
deno task build   # to _site/
```

## Publishing

`.github/workflows/pages.yml` builds the site with the JavaScript pages from croner's default
branch and deploys it to GitHub Pages. It runs on pushes to `main`, once a day, on demand, and
on a `croner-release` repository dispatch.
