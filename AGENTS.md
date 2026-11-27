# croner-site - Agent Guide

## Project Overview

croner-site is the source of [croner.56k.guru](https://croner.56k.guru), the documentation site for every
Croner implementation. It is built with [ombryt](https://ombryt.56k.guru) on its built-in `docs` theme
(`ombryt.toml`), and deployed to GitHub Pages from the `main` branch. All pages are committed in `src/`: the build reads
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
| .NET                    | [Hexagon/croner-dotnet](https://github.com/Hexagon/croner-dotnet) | `main`          | NuGet `Croner`          | `src/Croner/Croner.csproj` (`<VersionPrefix>`, and the CHANGELOG for the preview suffix) |
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
| `src/_data.yaml`         | `top_links` (the header) and `nav_links` (the repository links below the sidebar) |

## Sync instruction

Use this when asked to sync, update or check the site against the implementations. The goal is that the site
says what the five implementations actually do: go through each repository, find what changed, and bring
anything that matters for the site into the pages above.

1. Run `scripts/upstream.sh`. For each repository it lists the commits and changed files since the commit
   recorded in `upstream.json` (the last sync), with a compare link. `scripts/upstream.sh --diff` also prints
   the diff of README, CHANGELOG, `docs/` and the version files. The clones are in `.upstream/<name>`: read
   any other file there when the diff is not enough (e.g. `git -C .upstream/croner-cpp show FETCH_HEAD:README.md`).
2. For each changed repository, decide what affects the site. Typical things:
   - a new release (version file, CHANGELOG): version numbers in `src/installation.md`, `version`
     for croner also the JSR import in `src/installation.md`;
   - API changes: the quick example (a tab) in `src/index.md` must still compile/run with the current API;
   - new or removed features: the implementations table (Evaluate / Schedule / Describe) and features list
     in `src/index.md`;
   - install requirements (minimum language/runtime version, optional features, package name):
     `src/installation.md`;
   - pattern syntax, DST behavior or options: `src/usage/pattern.md`, including the "Options in each
     language" table and that the README anchors it links to still exist. Say which implementations
     support a change rather than describing it as universal;
   - croner (JavaScript) only: the usage, comparison and migration pages. croner may still keep copies of
     these in its `docs/`; carry over changes made there. A new page needs `title`, `nav_order` and
     `parent` front matter to be placed in the sidebar.
   Internal changes (tests, refactoring, CI) need nothing on the site.

   The site follows the branch in `upstream.json`: `master` (released) for croner, `main` for the others.
   When `main` is ahead of the published package (compare the version file with the package registry),
   follow `main` but say so in the pull request, and on the site where a copied example would fail.
   Check changed examples against the code: compile or run them where you can.
3. Make the changes on a branch of croner-site (never push to `main`), build with `ombryt build --strict`, and
   fix any errors.
4. Run `scripts/upstream.sh --update` to record the commits you synced to in `upstream.json`, and commit it
   with the page changes. Update `upstream.json` even when nothing on the site needed to change, so the
   next sync starts from there.
5. Open a pull request to croner-site. List per repository what changed upstream and what you changed on
   the site (or that nothing was needed), and anything one implementation has that the others lack.

If a repository's own docs are wrong or out of date, report it (or fix it in that repository if asked);
do not paper over it on the site.

## Development

Requires [ombryt](https://ombryt.56k.guru) (`cargo install ombryt --locked`, or a release archive) and git.

```bash
ombryt serve                 # rebuild on change, with live reload
ombryt build --strict        # to _site/; --strict fails on broken internal links and #fragments
scripts/upstream.sh          # what changed in the five repositories since last sync (--diff, --update)
```

- Every page in `src/` has front matter: `title`, and `nav_order` and `parent` (the `title` of the page it is
  under) to place it in the sidebar. `nav_title` is a shorter label for the sidebar and the previous/next links,
  and `nav_exclude: true` leaves a page out. The order also gives the previous/next links. Pages start with their
  own `# Heading` (`hide_title: true` is set for all pages in `src/_data.yaml`).
- Link to other pages by URL (`/usage/pattern/`, `/usage/examples/#error-handling`); the build checks every
  internal link and fragment.
- Callouts are GitHub alerts: a block quote starting with `> [!NOTE]` or `> [!WARNING]`.
- Code tabs: code blocks inside `<div class="tabs" data-labels="JavaScript,Rust,...">` (with blank lines around
  them) become tabs, one label per block, as in the quick examples in `src/index.md`.
- The layout is ombryt's `docs` theme. Additions are in `src/_includes/head.html` (stylesheet, tab script,
  analytics), `src/_includes/footer.html`, `src/assets/croner.css` and `src/assets/croner.js`; the icon is
  `src/favicon.svg`. Files in `src/` that are not Markdown are copied as they are; names starting with `_` are
  skipped. The build also writes `search.json` and `sitemap.xml`.
- `_site/` and `.upstream/` (clones made by `scripts/upstream.sh`) are ignored by git.

## Publishing

`.github/workflows/pages.yml` installs ombryt with the `Hexagon/ombryt@v0` action and builds on pull requests and on every push; only pushes to `main` (or a manual
run on `main`) deploy to GitHub Pages. Merging to `main` is publishing.
