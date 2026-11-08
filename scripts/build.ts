// Builds the site: every Markdown file in src/ becomes a page in _site/, other files are copied as they are
// (names starting with `_` are skipped). The page templates are in scripts/layout.ts.
//
// - `nav` in src/_data.json orders the pages into sidebar groups. Pages missing from it are listed in a warning.
// - `$CRONER_VERSION` is replaced with `version` from src/_data.json.
// - Relative links to .md files are rewritten to page URLs (`../pattern.md#x` becomes `/usage/pattern/#x`).
// - Fenced code gets a header with its language and a copy button. ```ts title="Node.js" sets the header text,
//   and code blocks in a <div class="tabs"> become tabs named by their titles.
// - A `{ .note }` or `{ .warning }` line after a block quote (or `{: .note }` before a paragraph) makes a callout.
// - search.json holds every page section for the search dialog.
//
// Usage: deno task build, or deno task serve to rebuild on changes and serve at http://localhost:8000

import { extract } from "@std/front-matter/yaml";
import { copy, emptyDir, ensureDir, walk } from "@std/fs";
import { serveDir } from "@std/http/file-server";
import { dirname, join, relative } from "@std/path";
import * as posix from "@std/path/posix";
import hljs from "highlight.js";
// @ts-types="npm:@types/markdown-it@^14"
import MarkdownIt from "markdown-it";
import { esc, layout, type Page, type Site } from "./layout.ts";

const SRC = "src", OUT = "_site";
const data = JSON.parse(await Deno.readTextFile(join(SRC, "_data.json")));

const slug = (s: string) => s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
const urlOf = (src: string) =>
  src === "404.md" ? "/404.html" : "/" + src.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "/");
const LANGS: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  rust: "Rust",
  python: "Python",
  csharp: "C#",
  cpp: "C++",
  toml: "TOML",
  bash: "Shell",
  sh: "Shell",
  cmake: "CMake",
  html: "HTML",
  json: "JSON",
};

const md = new MarkdownIt({ html: true, linkify: true });

// Give headings ids and anchor links, and collect them for the table of contents.
md.core.ruler.push("headings", (state) => {
  const seen = new Set<string>();
  state.env.headings = [];
  state.tokens.forEach((token, i) => {
    if (token.type !== "heading_open") return;
    const text = state.tokens[i + 1].children!.map((t) => t.content).join("");
    let id = slug(text);
    for (let n = 1; seen.has(id); n++) id = `${slug(text)}-${n}`;
    seen.add(id);
    token.attrSet("id", id);
    state.env.headings.push({ level: Number(token.tag[1]), id, text });
  });
});
md.renderer.rules.heading_close = (tokens, i) => {
  const open = tokens.findLast((t, j) => j < i && t.type === "heading_open")!;
  const anchor = open.tag === "h1"
    ? ""
    : `<a class="anchor" href="#${open.attrGet("id")}" aria-label="Link to this section">#</a>`;
  return `${anchor}</${tokens[i].tag}>\n`;
};

// Rewrite relative links to Markdown files to page URLs.
md.renderer.rules.link_open = (tokens, i, options, env, self) => {
  const href = tokens[i].attrGet("href") ?? "";
  const [, path, hash = ""] = href.match(/^([^:#]+\.md)(#.*)?$/) ?? [];
  if (path) tokens[i].attrSet("href", urlOf(posix.join(posix.dirname(env.src), path)) + hash);
  return self.renderToken(tokens, i, options);
};

// Code blocks with a header (language or title) and a copy button.
md.renderer.rules.fence = (tokens, i) => {
  const { info, content } = tokens[i];
  const lang = info.split(/\s+/)[0];
  const title = info.match(/title="([^"]+)"/)?.[1];
  const code = hljs.getLanguage(lang) ? hljs.highlight(content, { language: lang }).value : esc(content);
  const label = title ?? LANGS[lang] ?? lang;
  return `<div class="code${label ? "" : " bare"}"${title ? ` data-title="${esc(title)}"` : ""}>` +
    `<div class="code-head"><span>${esc(label)}</span><button class="copy" type="button">Copy</button></div>` +
    `<pre><code class="language-${esc(lang || "text")}">${code}</code></pre></div>\n`;
};

// Callouts. A leading bold line (`**Warning**` and a line break) or bold label (`**Deviation:** text`) becomes the title.
const callout = (cls: string, inner: string) => {
  let title = cls[0].toUpperCase() + cls.slice(1);
  inner = inner.replace(/^<p><strong>([^<]+?):?<\/strong>(?:<br>\n|\n|:? +)/, (_, t) => {
    title = t;
    return "<p>";
  });
  return `<div class="callout ${cls}"><p class="callout-title">${esc(title)}</p>\n${inner}</div>\n`;
};
const callouts = (html: string) =>
  html
    .replace(/<blockquote>\n([\s\S]*?)<\/blockquote>\n(?:<p>\{:? *\.(\w+) *\}<\/p>\n)?/g, (all, inner, cls) => {
      const inside = inner.match(/\n\{:? *\.(\w+) *\}<\/p>\n$/);
      if (inside) [cls, inner] = [inside[1], inner.slice(0, -inside[0].length) + "</p>\n"];
      return cls ? callout(cls, inner) : all;
    })
    .replace(/<p>\{:? *\.(\w+) *\}\n([\s\S]*?<\/p>)\n/g, (_, cls, rest) => callout(cls, `<p>${rest}\n`));

// Search sections: the text under each h2/h3 (and the text before the first one).
const plain = (html: string) =>
  html.replace(/<a class="anchor"[^>]*>#<\/a>|<div class="code-head">[\s\S]*?<\/div>/g, "")
    .replace(/<\/(p|li|h\d|td|th|pre|div|tr|blockquote)>|<br>/g, " ").replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
const sections = (page: Page) =>
  page.html.split(/(?=<h[23] id=")/).map((part) => {
    const [, id, heading] = part.match(/^<h[23] id="([^"]+)">([\s\S]*?)<a class="anchor"/) ?? [];
    return {
      url: page.url + (id ? `#${id}` : ""),
      page: page.title,
      heading: heading ? plain(heading) : "",
      text: plain(part.replace(/^<h[123][\s\S]*?<\/h[123]>/, "")),
    };
  }).filter((s) => s.text || s.heading);

// Read and render all pages.
const pages: Page[] = [];
await emptyDir(OUT);
for await (const entry of walk(SRC, { includeDirs: false })) {
  const src = relative(SRC, entry.path).replaceAll("\\", "/");
  if (src.split("/").some((part) => part.startsWith("_"))) continue;
  if (!src.endsWith(".md")) {
    await ensureDir(dirname(join(OUT, src)));
    await copy(entry.path, join(OUT, src));
    continue;
  }
  const { attrs, body } = extract<Record<string, string>>(await Deno.readTextFile(entry.path));
  const env = { src, headings: [] as Page["headings"] };
  const html = callouts(md.render(body.replaceAll("$CRONER_VERSION", data.version), env));
  pages.push({
    src,
    url: urlOf(src),
    title: attrs.title ?? env.headings[0]?.text ?? src,
    description: attrs.description,
    layout: attrs.layout ?? "doc",
    html,
    headings: env.headings,
  });
}

// Navigation groups from _data.json.
const bySrc = new Map(pages.map((p) => [p.src, p]));
const nav: Site["nav"] = data.nav.map((group: { title: string; pages: (string | [string, string])[] }) => ({
  title: group.title,
  items: group.pages.map((entry) => {
    const [src, label] = Array.isArray(entry) ? entry : [entry];
    const page = bySrc.get(src);
    if (!page) throw new Error(`The nav in src/_data.json lists ${src}, which is not in src/`);
    page.group = group.title;
    return { page, label: label ?? page.title };
  }),
}));
const unlisted = pages.filter((p) => !p.group && p.src !== "404.md").map((p) => p.src);
if (unlisted.length) console.warn(`Not in the nav in src/_data.json: ${unlisted.join(", ")}`);

// Write pages, search index, sitemap and robots.txt.
const site: Site = { ...data, nav, flat: nav.flatMap((g) => g.items) };
for (const page of pages) {
  const file = join(OUT, page.url.endsWith("/") ? page.url + "index.html" : page.url);
  await ensureDir(dirname(file));
  await Deno.writeTextFile(file, layout(page, site));
}
await Deno.writeTextFile(join(OUT, "search.json"), JSON.stringify(site.flat.flatMap(({ page }) => sections(page))));
await Deno.writeTextFile(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    site.flat.map(({ page }) => `  <url><loc>${data.url}${page.url}</loc></url>`).join("\n")
  }\n</urlset>\n`,
);
await Deno.writeTextFile(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${data.url}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages to ${OUT}/`);

if (Deno.args.includes("--serve")) {
  Deno.serve({ port: 8000 }, (req) => serveDir(req, { fsRoot: OUT, quiet: true }));
}
