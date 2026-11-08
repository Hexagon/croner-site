// Shows what has changed in the five Croner implementations since the site was last synced
// with them, so the site can be updated to match. See "Sync instruction" in AGENTS.md.
//
//   deno task upstream            list new commits and changed files per repository
//   deno task upstream --diff     also print the diff of documentation files (README, CHANGELOG, docs/, ...)
//   deno task upstream --update   record the current commit of each repository as synced, in upstream.json
//
// Repositories are cloned (without file contents until needed) into .upstream/, which is ignored by git.
// upstream.json records the branch followed and the last synced commit of each repository.

const CONFIG = "upstream.json";
const DIR = ".upstream";
// Files whose diff is printed with --diff: what the site is written from.
const DOC_PATHS = [
  "README.md",
  "CHANGELOG.md",
  "MIGRATION.md",
  "docs",
  "package.json",
  "Cargo.toml",
  "pyproject.toml",
  "src/croner/__init__.py",
  "src/Croner/Croner.csproj",
  "CMakeLists.txt",
];

interface Repo {
  url: string;
  branch: string;
  synced: string;
}

async function git(args: string[], cwd?: string): Promise<string> {
  const out = await new Deno.Command("git", { args, cwd, stdout: "piped", stderr: "piped" }).output();
  if (!out.success) {
    throw new Error(`git ${args.join(" ")} failed:\n${new TextDecoder().decode(out.stderr)}`);
  }
  return new TextDecoder().decode(out.stdout).trimEnd();
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

const showDiff = Deno.args.includes("--diff");
const update = Deno.args.includes("--update");
const repos: Record<string, Repo> = JSON.parse(await Deno.readTextFile(CONFIG));

await Deno.mkdir(DIR, { recursive: true });
let changed = 0;
for (const [name, repo] of Object.entries(repos)) {
  const path = `${DIR}/${name}`;
  if (!(await exists(path))) {
    await git(["clone", "--quiet", "--filter=blob:none", "--no-checkout", repo.url, path]);
  }
  await git(["fetch", "--quiet", "origin", repo.branch], path);
  const head = await git(["rev-parse", "FETCH_HEAD"], path);
  const range = `${repo.synced}..${head}`;

  console.log(`\n## ${name} (${repo.branch})`);
  if (head === repo.synced) {
    console.log("No changes since last sync.");
    continue;
  }
  changed++;
  console.log(`${repo.url}/compare/${repo.synced.slice(0, 12)}...${head.slice(0, 12)}\n`);
  console.log(await git(["log", "--oneline", "--no-decorate", range], path));
  console.log("\n" + await git(["diff", "--stat=120", range], path));
  if (showDiff) {
    const diff = await git(["diff", range, "--", ...DOC_PATHS], path);
    if (diff) console.log("\n" + diff);
  }
  if (update) repo.synced = head;
}

if (update) {
  await Deno.writeTextFile(CONFIG, JSON.stringify(repos, null, 2) + "\n");
  console.log(`\nRecorded the current commits in ${CONFIG}.`);
} else {
  console.log(`\n${changed} of ${Object.keys(repos).length} repositories changed since last sync.`);
}
