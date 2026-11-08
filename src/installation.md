---
title: "Installation"
nav_order: 2
---

# Installation

---

Croner is available for JavaScript/TypeScript, Rust, Python, .NET and C++. Pick the section for your language.

## JavaScript / TypeScript

Croner can be installed using your preferred package manager or CDN. After installation, it can be included in your project as follows:

> If you are migrating from a different library such as `cron` or `node-cron`, or upgrading from an older version of croner, see the [Migration Guide](migration.md).
{ .note }

### Importing with Node.js or Bun

For Node.js or Bun, install `croner` from npm (`npm install croner`), then use ESM Import or CommonJS Require:

```ts
// ESM Import
import { Cron } from "croner";

// or CommonJS Require, destructure to add type hints
const { Cron } = require("croner");
```

### Importing with Deno

For Deno, import Croner from JSR:

```ts
import { Cron } from "jsr:@hexagon/croner@$CRONER_VERSION";
```

### In a Webpage Using the UMD-module

To use Croner in a webpage, you can load it as a UMD module from a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/croner@11/dist/croner.umd.js"></script>
```

## Rust

Add `croner` to your `Cargo.toml`:

```toml
[dependencies]
croner = "4.0"
```

`chrono` is the default date and time backend. To use `jiff` instead, disable the default features: `croner = { version = "4.0", default-features = false, features = ["jiff"] }`. See [croner-rust](https://github.com/Hexagon/croner-rust) for usage.

## Python

Croner for Python needs Python 3.9 or later:

```bash
pip install croner
```

On Windows, which has no system time zone database, use `pip install croner[tzdata]` to use the `timezone` option. See [croner-py](https://github.com/Hexagon/croner-py) for usage.

## .NET

Croner for .NET targets .NET 8 and .NET 10:

```sh
dotnet add package Croner --prerelease
```

Croner for .NET is in preview, so `--prerelease` is needed until 1.0.0 is released. The examples on this site use the API of 1.0.0-preview.2, which renames several members of 1.0.0-preview.1 (for example `IterAfter` is now `GetNextOccurrences`), see the [changelog](https://github.com/Hexagon/croner-dotnet/blob/main/CHANGELOG.md).

See [croner-dotnet](https://github.com/Hexagon/croner-dotnet) for usage.

## C++

Croner for C++ is header-only and needs C++17 and threads. Add it with CMake `FetchContent`:

```cmake
include(FetchContent)
FetchContent_Declare(croner
  GIT_REPOSITORY https://github.com/Hexagon/croner-cpp.git
  GIT_TAG        <tag or commit>)
FetchContent_MakeAvailable(croner)
target_link_libraries(my_app PRIVATE croner::croner)
```

It can also be installed with CMake (`find_package(croner)`) or a local Conan recipe, or by copying the headers in `include/croner` to your include path.

Time zones are read from the system zoneinfo database on Linux, macOS and the BSDs. On Windows, build as C++20 with MSVC to use `std::chrono::tzdb`. See [croner-cpp](https://github.com/Hexagon/croner-cpp) for details and usage.
