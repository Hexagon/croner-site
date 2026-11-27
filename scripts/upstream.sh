#!/usr/bin/env bash
# Shows what has changed in the five Croner implementations since the site was last synced
# with them, so the site can be updated to match. See "Sync instruction" in AGENTS.md.
#
#   scripts/upstream.sh            list new commits and changed files per repository
#   scripts/upstream.sh --diff     also print the diff of documentation files (README, CHANGELOG, docs/, ...)
#   scripts/upstream.sh --update   record the current commit of each repository as synced, in upstream.json
#
# Repositories are cloned (without file contents until needed) into .upstream/, which is ignored by git.
# upstream.json records the branch followed and the last synced commit of each repository. Needs git only.
set -euo pipefail
cd "$(dirname "$0")/.."

CONFIG=upstream.json
DIR=.upstream
# Files whose diff is printed with --diff: what the site is written from.
DOC_PATHS=(README.md CHANGELOG.md MIGRATION.md docs package.json Cargo.toml pyproject.toml
  src/croner/__init__.py src/Croner/Croner.csproj CMakeLists.txt)

show_diff=false
update=false
for arg in "$@"; do
  case "$arg" in
    --diff) show_diff=true ;;
    --update) update=true ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# Each repository in upstream.json as "name url branch synced", one per line.
repos() {
  awk -F'"' '
    /^  "[^"]+": \{/ { name = $2 }
    /"url":/ { url = $4 }
    /"branch":/ { branch = $4 }
    /"synced":/ { print name, url, branch, $4 }
  ' "$CONFIG"
}

mkdir -p "$DIR"
changed=0
total=0
while read -r name url branch synced; do
  total=$((total + 1))
  path="$DIR/$name"
  [ -d "$path" ] || git clone --quiet --filter=blob:none --no-checkout "$url" "$path"
  git -C "$path" fetch --quiet origin "$branch"
  head=$(git -C "$path" rev-parse FETCH_HEAD)

  printf '\n## %s (%s)\n' "$name" "$branch"
  if [ "$head" = "$synced" ]; then
    echo "No changes since last sync."
    continue
  fi
  changed=$((changed + 1))
  printf '%s/compare/%s...%s\n\n' "$url" "${synced:0:12}" "${head:0:12}"
  git -C "$path" log --oneline --no-decorate "$synced..$head"
  echo
  git -C "$path" diff --stat=120 "$synced..$head"
  if $show_diff; then
    echo
    git -C "$path" diff "$synced..$head" -- "${DOC_PATHS[@]}"
  fi
  if $update; then
    sed -i.bak "/^  \"$name\": {/,/}/ s/\"synced\": \"$synced\"/\"synced\": \"$head\"/" "$CONFIG"
    rm -f "$CONFIG.bak"
  fi
done < <(repos)

if $update; then
  printf '\nRecorded the current commits in %s.\n' "$CONFIG"
else
  printf '\n%s of %s repositories changed since last sync.\n' "$changed" "$total"
fi
