# croner-site - Agent Guide

## Project Overview

croner-site is the source of [croner.56k.guru](https://croner.56k.guru), the documentation site for every
Croner implementation. It is built by one Deno script, `scripts/build.ts` (markdown-it and highlight.js, no
framework), and deployed to GitHub Pages from the `main` branch. All pages are committed in `src/`: the build reads
nothing from the other repositories.

## The Croner repositories

The site documents these five repositories. They are the sources of truth for what the site says about
them; this repository only follows them.

| Implementation          | Repository                                                 | Branch to compare with | Package                 | Version is in                         |
|-------------------------|------------------------------------------------------------|------------------------|-------------------------|---------------------------------------|
| JavaScript / TypeScript | [Hexagon/croner](https://github.com/Hexagon/croner)        | `master` (released), `dev` (next) | npm `croner`, JSR `@hexagon/croner` | `package.json` (and `deno.json`) |
| Rust                    | [Hexagon/croner-rust](https://github.com/Hexagon/croner-rust) | `main`              | crates.io `croner`      | `Cargo.toml`                          |
| Python                  | [Hexagon/croner-py](https://github.com/Hexagon/croner-py)  | `main`                 | PyPI `croner`           | `src/croner/__init__.py` (`__version__`) |
| .NET                    | [Hexagon/croner-dotnet](https://github.com/Hexagon/croner-dotnet) | `main`          | NuGet `Croner`          | `src/Croner/Croner.csproj` (`<Version>`) |
| C++                     | [Hexagon/croner-cpp](https://github.com/Hexagon/croner-cpp) | `main`                | header-only (CMake, Conan) | `CMakeLists.txt` (`project(... VERSION)`) |

Each repository has its own README (and `AGENTS.md` in croner and croner-py) describing its API, options and
behavior. Read those, and the `CHANGELOG.md` where there is one, when syncing.

## Where each repository shows up on the site

| Page                     | Content taken from                                                                         |
|--------------------------|--------------------------------------------------------------------------------------------|
| `src/index.md`           | All five: the implementations table (Evaluate / Schedule / Describe), the features list and one quick example per language |
| `src/installation.md`    | All five: package name, install command, supported language/runtime versions, optional features (e.g. Rust `chrono`/`jiff`, Python `tzdata`) |
| `src/usage/pattern.md`   | All five: pattern syntax, nicknames, per-language exceptions, and the "Options in each language" table with links to each README section |
| `src/contributing.md`    | General; links to every repository                                                         |
| `src/usage/index.md`, `basics.md`, `configuration.md`, `examples.md`, `src/comparison.md`, `src/migration.md` | JavaScript only: copies of `docs/` in croner (see below) |
| `src/_data.json`         | `version` (croner's latest released version, used for `$CRONER_VERSION`) and `repos`, the repository links in the sidebar |

## Sync instruction

Use this when asked to sync, update or check the site against the implementations. Work on a branch of
croner-site and open a pull request; never push directly to `main`.

1. Clone or fetch all five repositories next to this one (`../croner`, `../croner-rust`, `../croner-py`,
   `../croner-dotnet`, `../croner-cpp`). For croner, look at `master` for what is released and `dev` for what
   is coming; the site describes released behavior unless asked otherwise.
2. Find what changed since the site was last synced: compare each repository's README, CHANGELOG, version
   and public options with what the pages above say (`git log` of croner-site shows the last sync).
3. JavaScript pages: run `deno task sync ../croner` with croner checked out at the branch to publish
   (normally `master`). It copies `docs/**/*.md` (except `docs/README.md`) into `src/` and updates
   `version` in `src/_data.json` for a release version. Review the diff. Pages that exist in `src/` but no longer in
   croner's `docs/` must be removed by hand. If croner's `docs/` still has the old layout (`docs/src/`), the
   script stops: copy the changed JavaScript pages by hand instead, keeping the titles, `parent` and
   `nav_order` already used in `src/`.
4. Shared pages: for each repository, check and update
   - its row in the implementations table and the features list in `src/index.md`,
   - its quick example in `src/index.md` (it must still compile/run with the current API),
   - its section in `src/installation.md` (package name, version in examples such as `croner = "4.0"`,
     minimum language/runtime version, optional features),
   - its column in the options table in `src/usage/pattern.md`, and any per-language notes on pattern
     syntax (e.g. nicknames or fields one implementation does not support), and that the README anchors
     linked there still exist.
5. A change in pattern syntax or DST behavior in one implementation is a change for the shared pattern page:
   say which implementations support it, rather than describing it as universal.
6. Build the site (`deno task build`) and fix any errors before opening the pull request. List in the pull
   request what changed per repository, and anything found in one implementation that the others lack.

If a repository's own docs are wrong or out of date, report it (or fix it in that repository if asked);
do not paper over it on the site.

## Development

Requires [Deno](https://deno.com) 2.

```bash
deno task serve   # rebuild on change, http://localhost:8000
deno task build   # to _site/
deno task sync ../croner   # copy the JavaScript pages from a croner checkout
```

- Front matter (`title`, `nav_order`, and `parent` with the title of the parent page) drives the sidebar.
  `has_children` (used in croner's `docs/`) is accepted and ignored.
- `$CRONER_VERSION` in a page is replaced with `version` in `src/_data.json`.
- Relative links to `.md` files are rewritten to page URLs (`usage/pattern.md` becomes `/usage/pattern/`).
- `{ .note }` or `{ .warning }` on the line after a block quote (or `{: .note }` before a paragraph) makes it a callout.
- The page layout is the `layout` function in `scripts/build.ts`; styles are in `src/style.css`. Files in `src/` that
  are not Markdown are copied as they are; names starting with `_` are skipped.
- `_site/` and a `/croner/` checkout are ignored by git.

## Publishing

`.github/workflows/pages.yml` builds on pull requests and on every push; only pushes to `main` (or a manual
run on `main`) deploy to GitHub Pages. Merging to `main` is publishing.
