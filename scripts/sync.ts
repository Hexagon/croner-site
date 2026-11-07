// Copies the JavaScript documentation pages from the croner repository into src/,
// and sets $CRONER_VERSION to the version in croner's package.json.
//
// Usage: deno task sync [path to a croner checkout]
// The path defaults to ./croner (where CI checks it out), then ../croner.

import { copy, exists, walk } from "jsr:@std/fs@^1";
import { join, relative } from "jsr:@std/path@^1";

const candidates = Deno.args[0] ? [Deno.args[0]] : ["croner", "../croner"];
let croner: string | undefined;
for (const candidate of candidates) {
  if (await exists(join(candidate, "docs"))) {
    croner = candidate;
    break;
  }
}
if (!croner) {
  console.error(
    `No croner checkout found at ${candidates.join(" or ")}.\n` +
      "Clone https://github.com/Hexagon/croner next to this repository, or pass its path.",
  );
  Deno.exit(1);
}

const docs = join(croner, "docs");
if (await exists(join(docs, "src"))) {
  console.error(
    `${croner} has the old docs layout (docs/src), from before the site moved to croner-site.\n` +
      "Use a croner version where docs/ holds the JavaScript pages directly.",
  );
  Deno.exit(1);
}
for await (const entry of walk(docs, { includeDirs: false })) {
  const path = relative(docs, entry.path);
  if (path === "README.md" || !path.endsWith(".md")) continue;
  await copy(entry.path, join("src", path), { overwrite: true });
  console.log(`Copied ${path}`);
}

const { version } = JSON.parse(await Deno.readTextFile(join(croner, "package.json")));
const dataFile = join("src", "_data.json");
const data = JSON.parse(await Deno.readTextFile(dataFile));
if (data.substitute.$CRONER_VERSION !== version) {
  data.substitute.$CRONER_VERSION = version;
  await Deno.writeTextFile(dataFile, JSON.stringify(data, null, 2) + "\n");
  console.log(`Set $CRONER_VERSION to ${version}`);
}
