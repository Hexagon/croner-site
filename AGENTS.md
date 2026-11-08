# croner-site - Agent Guide

## Project Overview

croner-site is the source of [croner.56k.guru](https://croner.56k.guru), the documentation site for every
Croner implementation. It is built with [Lume](https://lume.land) and [Lumocs](https://github.com/Hexagon/lumocs)
and deployed to GitHub Pages from the `main` branch. All pages are committed in `src/`: the build reads
nothing from the other repositories.

## The Croner repositories

The site documents these five repositories (listed with the branch followed and the last synced commit in
`upstream.json`). They are the sources of truth for what the site says about
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
| `src/usage/index.md`, `basics.md`, `configuration.md`, `examples.md`, `src/comparison.md`, `src/migration.md` | JavaScript only, from croner's README, `docs/` (if present) and `CHANGELOG.md` |
| `src/_data.json`         | `$CRONER_VERSION` (croner's latest released version), `nav_links` and `top_links` to the repositories |

## Sync instruction

Use this when asked to sync, update or check the site against the implementations. The goal is that the site
says what the five implementations actually do: go through each repository, find what changed, and bring
anything that matters for the site into the pages above.

1. Run `deno task upstream`. For each repository it lists the commits and changed files since the commit
   recorded in `upstream.json` (the last sync), with a compare link. `deno task upstream --diff` also prints
   the diff of README, CHANGELOG, `docs/` and the version files. The clones are in `.upstream/<name>`: read
   any other file there when the diff is not enough (e.g. `git -C .upstream/croner-cpp show FETCH_HEAD:README.md`).
2. For each changed repository, decide what affects the site. Typical things:
   - a new release (version file, CHANGELOG): version numbers in `src/installation.md`, `$CRONER_VERSION`
     in `src/_data.json` for croner;
   - API changes: the quick example in `src/index.md` must still compile/run with the current API;
   - new or removed features: the implementations table (Evaluate / Schedule / Describe) and features list
     in `src/index.md`;
   - install requirements (minimum language/runtime version, optional features, package name):
     `src/installation.md`;
   - pattern syntax, DST behavior or options: `src/usage/pattern.md`, including the "Options in each
     language" table and that the README anchors it links to still exist. Say which implementations
     support a change rather than describing it as universal;
   - croner (JavaScript) only: the usage, comparison and migration pages. croner may still keep copies of
     these in its `docs/`; carry over changes made there.
   Internal changes (tests, refactoring, CI) need nothing on the site.
3. Make the changes on a branch of croner-site (never push to `main`), build with `deno task build`, and
   fix any errors.
4. Run `deno task upstream --update` to record the commits you synced to in `upstream.json`, and commit it
   with the page changes. Update `upstream.json` even when nothing on the site needed to change, so the
   next sync starts from there.
5. Open a pull request to croner-site. List per repository what changed upstream and what you changed on
   the site (or that nothing was needed), and anything one implementation has that the others lack.

If a repository's own docs are wrong or out of date, report it (or fix it in that repository if asked);
do not paper over it on the site.

## Development

Requires [Deno](https://deno.com) 2.

```bash
deno task serve   # http://localhost:8000
deno task build   # to _site/
deno task upstream         # what changed in the five repositories since last sync (--diff, --update)
```

- Front matter (`title`, `parent`, `nav_order`, `has_children`) drives the Lumocs navigation.
- `$CRONER_VERSION` in a page is replaced with the value in `src/_data.json`.
- `_site/` and `.upstream/` (clones made by `deno task upstream`) are ignored by git.

## Publishing

`.github/workflows/pages.yml` builds on pull requests and on every push; only pushes to `main` (or a manual
run on `main`) deploy to GitHub Pages. Merging to `main` is publishing.
