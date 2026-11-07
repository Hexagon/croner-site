---
title: "Contributing"
nav_order: 7
---

# Contributing to Croner

---

Croner is developed in one repository per language, plus one for this site. Contributions are welcome in all of them.

| Repository                                                | Contents                     | How to contribute                                                                         |
|-----------------------------------------------------------|------------------------------|-------------------------------------------------------------------------------------------|
| [croner](https://github.com/Hexagon/croner)               | JavaScript / TypeScript      | [CONTRIBUTING.md](https://github.com/Hexagon/croner/blob/master/CONTRIBUTING.md)          |
| [croner-rust](https://github.com/Hexagon/croner-rust)     | Rust                         | [Development](https://github.com/Hexagon/croner-rust#development)                         |
| [croner-py](https://github.com/Hexagon/croner-py)         | Python                       | [Development](https://github.com/Hexagon/croner-py#development)                           |
| [croner-dotnet](https://github.com/Hexagon/croner-dotnet) | .NET                         | [Development](https://github.com/Hexagon/croner-dotnet#development)                       |
| [croner-cpp](https://github.com/Hexagon/croner-cpp)       | C++                          | [Tests](https://github.com/Hexagon/croner-cpp#tests)                                      |
| [croner-site](https://github.com/Hexagon/croner-site)     | This site                    | See below                                                                                 |

If you're looking to support Croner financially, consider checking out our [Sponsorship page](sponsors.md).

## Issues

If you spot a problem, search the issues of the repository for that language first. Problems with the pattern syntax or DST handling often affect every implementation, so mention if you have checked the others.

A change to how patterns are read should be made in every implementation, so that a pattern gives the same runs in all languages. Open an issue in [croner](https://github.com/Hexagon/croner/issues) to discuss it first.

## Changing this site

The site is built with [Lume](https://lume.land) and [Lumocs](https://github.com/Hexagon/lumocs), and published to GitHub Pages from the `main` branch of [croner-site](https://github.com/Hexagon/croner-site).

-   The overview, installation, pattern, contributing and sponsorship pages are in `src/` in croner-site.
-   The JavaScript pages (usage, comparison and migration) are in [`docs/`](https://github.com/Hexagon/croner/tree/dev/docs) in the croner repository, and are copied in when the site is built. Change them there.

To build the site locally, install [Deno](https://deno.com), clone croner next to croner-site, then run `deno task sync` and `deno task serve` in croner-site.
