---
title: "Overview"
nav_order: 1
---

<p align="center">
<img class="logo" src="https://cdn.jsdelivr.net/gh/hexagon/croner@master/croner.png" alt="Croner" width="150" height="150"><br>
Trigger functions or evaluate cron expressions. No dependencies. All features. JavaScript/TypeScript, Rust, Python, .NET and C++. <br><br>Try the JavaScript version live on <a href="https://jsfiddle.net/hexag0n/hoa8kwsb/">jsfiddle</a>.<br>
</p>

## Implementations

Croner is available for several languages. All implementations parse the same [patterns](usage/pattern.md), follow the same rules for daylight saving time and share test cases, so a pattern gives the same runs whichever language you use it from.

| Language                  | Repository                                                  | Package                                                                                          | Evaluate | Schedule | Describe |
|---------------------------|-------------------------------------------------------------|--------------------------------------------------------------------------------------------------|:--------:|:--------:|:--------:|
| JavaScript / TypeScript   | [croner](https://github.com/Hexagon/croner)                 | [npm](https://www.npmjs.com/package/croner), [JSR](https://jsr.io/@hexagon/croner)               |    ✓     |    ✓     |          |
| Rust                      | [croner-rust](https://github.com/Hexagon/croner-rust)       | [crates.io](https://crates.io/crates/croner)                                                     |    ✓     |          |    ✓     |
| Python                    | [croner-py](https://github.com/Hexagon/croner-py)           | [PyPI](https://pypi.org/project/croner/)                                                         |    ✓     |    ✓     |    ✓     |
| .NET                      | [croner-dotnet](https://github.com/Hexagon/croner-dotnet)   | [NuGet](https://www.nuget.org/packages/Croner)                                                   |    ✓     |    ✓     |    ✓     |
| C++                       | [croner-cpp](https://github.com/Hexagon/croner-cpp)         | Header-only, see [Installation](installation.md)                                   |    ✓     |    ✓     |          |

*Evaluate*: find next and previous runs, and check if a date matches. *Schedule*: run a function on the pattern, with pause, resume, stop and overrun protection. *Describe*: a human readable description of the pattern, like "At 09:30, on Monday, Tuesday, Wednesday, Thursday, and Friday."

The usage documentation for JavaScript is on this site. The other implementations are documented in the README of each repository.

## Features

*   **OCPS 1.0-1.4 compliant**: Supports the [Open Cron Pattern Specification](https://github.com/open-source-cron/ocps), including seconds and year fields, `L` (last), `W` (weekday), `#` (nth occurrence), and `+` (AND logic). DST handling follows Vixie cron instead of the OCPS 1.4 recommendation, the same in every implementation, see [Pattern](usage/pattern.md).
*   Find next and previous runs, or check if a date matches a pattern.
*   Target different time zones, with well defined DST behavior.
*   Schedule functions (all but Rust), with [overrun protection](usage/examples.md#overrun-protection), [error handling](usage/examples.md#error-handling), pause, resume, stop, max runs, minimum interval, and start and stop dates.
*   Operates in-memory, with no need for a database or configuration files.
*   Zero dependencies, apart from a date and time crate in Rust (`chrono` or `jiff`).

The JavaScript version also:

*   Works in Node.js >=18.0 (both require and import), Deno >=2.0 and Bun >=1.0.0.
*   Works in browsers as standalone, UMD or ES-module.
*   Includes [TypeScript](https://www.typescriptlang.org/) typings.
*   Supports asynchronous functions.
*   Is thoroughly tested and relied upon by well-known projects such as [pm2](https://github.com/unitech/pm2), [Uptime Kuma](https://github.com/louislam/uptime-kuma), [ZWave JS](https://github.com/zwave-js/zwave-js-ui) and [TrueNAS](https://github.com/truenas/webui).

## Quick examples

**The next five weekdays at 09:30 in Stockholm**, in each language.

JavaScript / TypeScript:

```ts
import { Cron } from "croner";

const job = new Cron("30 9 * * MON-FRI", { timezone: "Europe/Stockholm" });
console.log(job.nextRuns(5));
```

Rust (with the `chrono-tz` crate for the time zone):

```rust
use chrono::Utc;
use chrono_tz::Europe::Stockholm;
use croner::Cron;
use std::str::FromStr;

let cron = Cron::from_str("30 9 * * MON-FRI").expect("Invalid pattern");
let now = Utc::now().with_timezone(&Stockholm);
for run in cron.iter_after(now).take(5) {
    println!("{run}");
}
```

Python:

```python
from croner import Cron

job = Cron("30 9 * * MON-FRI", timezone="Europe/Stockholm")
print(job.next_runs(5))
```

C# (.NET):

```csharp
using Croner;

var cron = Cron.Parse("30 9 * * MON-FRI");
var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");
foreach (var run in cron.GetNextOccurrences(DateTimeOffset.UtcNow, tz).Take(5))
{
    Console.WriteLine(run);
}
```

C++:

```cpp
#include <croner/croner.hpp>
#include <iostream>

int main() {
  croner::CronOptions opts;
  opts.zone = croner::locate_zone("Europe/Stockholm");
  const croner::Cron cron("30 9 * * MON-FRI", opts);
  for (auto run : cron.next_runs(5)) std::cout << croner::to_iso_string(run) << "\n";
}
```

More JavaScript examples are in [Usage (JavaScript)](usage/examples.md), and a comparison with other JavaScript libraries in [Comparison (JavaScript)](comparison.md).
