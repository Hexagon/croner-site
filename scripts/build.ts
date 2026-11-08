// Builds the site: every Markdown file in src/ becomes a page in _site/, other files are copied as they are.
// Front matter: `title`, `nav_order` and `parent` (the title of the parent page) build the navigation.
// `$CRONER_VERSION` is replaced with `version` from src/_data.json. Links to .md files are rewritten to page URLs.
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

type Heading = { level: number; id: string; text: string };
type Page = {
  src: string;
  url: string;
  title: string;
  order: number;
  parent?: string;
  html: string;
  headings: Heading[];
};

const SRC = "src", OUT = "_site";
const LOGO = "https://cdn.jsdelivr.net/gh/hexagon/croner@master/croner.png";
const ANALYTICS = "https://track.webpulseanalytics.com/client/653eb150048754e8b13f076e";
const data = JSON.parse(await Deno.readTextFile(join(SRC, "_data.json")));

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);
const slug = (s: string) => s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
const urlOf = (src: string) =>
  src === "404.md" ? "/404.html" : "/" + src.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "/");

const md = new MarkdownIt({
  html: true,
  linkify: true,
  highlight: (code, lang) => hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : "",
});

// Give headings ids and collect them for the table of contents.
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

// Rewrite relative links to Markdown files (`../pattern.md#x`) to page URLs (`/usage/pattern/#x`).
md.renderer.rules.link_open = (tokens, i, options, env, self) => {
  const href = tokens[i].attrGet("href") ?? "";
  const [, path, hash = ""] = href.match(/^([^:#]+\.md)(#.*)?$/) ?? [];
  if (path) tokens[i].attrSet("href", urlOf(posix.join(posix.dirname(env.src), path)) + hash);
  return self.renderToken(tokens, i, options);
};

// Callouts: a `{ .note }` (or `{: .warning }`) line after a block quote, or before a paragraph, sets its class.
const callouts = (html: string) =>
  html
    .replace(/<blockquote>\n([\s\S]*?)<\/blockquote>(?:\n<p>\{:? *\.(\w+) *\}<\/p>)?/g, (_, inner, cls) => {
      const inside = inner.match(/\n\{:? *\.(\w+) *\}<\/p>\n$/);
      if (inside) [cls, inner] = [inside[1], inner.slice(0, -inside[0].length) + "</p>\n"];
      return `<blockquote${cls ? ` class="callout ${cls}"` : ""}>\n${inner}</blockquote>`;
    })
    .replace(/<p>\{:? *\.(\w+) *\}\n/g, '<p class="callout $1">');

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
  const { attrs, body } = extract<Record<string, string | number>>(await Deno.readTextFile(entry.path));
  const env = { src, headings: [] as Heading[] };
  const html = callouts(md.render(body.replaceAll("$CRONER_VERSION", data.version), env));
  const title = String(attrs.title ?? env.headings[0]?.text ?? src);
  pages.push({
    src,
    url: urlOf(src),
    title,
    order: Number(attrs.nav_order ?? 99),
    parent: attrs.parent as string,
    html,
    headings: env.headings,
  });
}

const byOrder = (a: Page, b: Page) => a.order - b.order || a.title.localeCompare(b.title);
const children = (title?: string) => pages.filter((p) => p.parent === title && p.src !== "404.md").sort(byOrder);
const flat = children().flatMap((p) => [p, ...children(p.title)]);

const navList = (list: Page[], current: Page): string =>
  `<ul>${
    list.map((p) =>
      `<li><a href="${p.url}"${p === current ? ' aria-current="page"' : ""}>${esc(p.title)}</a>` +
      (children(p.title).length ? navList(children(p.title), current) : "") + "</li>"
    ).join("")
  }</ul>`;

const toc = (page: Page) => {
  const items = page.headings.filter((h) => h.level === 2 || h.level === 3);
  if (items.length < 2) return "";
  const top = Math.min(...items.map((h) => h.level));
  return `<aside class="toc"><p>On this page</p><ul>${
    items.map((h) => `<li${h.level > top ? ' class="sub"' : ""}><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")
  }</ul></aside>`;
};

const pager = (page: Page) => {
  const i = flat.indexOf(page);
  const link = (p: Page | undefined, rel: string, label: string) =>
    p ? `<a class="${rel}" href="${p.url}" rel="${rel}"><small>${label}</small>${esc(p.title)}</a>` : "<span></span>";
  return i < 0
    ? ""
    : `<nav class="pager">${link(flat[i - 1], "prev", "Previous")}${link(flat[i + 1], "next", "Next")}</nav>`;
};

const layout = (page: Page) =>
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.url === "/" ? `${data.title}: ${esc(data.description)}` : `${esc(page.title)} · ${data.title}`}</title>
<meta name="description" content="${esc(data.description)}">
<link rel="canonical" href="${data.url}${page.url}">
<link rel="icon" href="${LOGO}">
<link rel="stylesheet" href="/style.css">
<script async type="module" src="${ANALYTICS}"></script>
</head>
<body>
<header class="top">
  <button class="menu" aria-label="Menu" onclick="document.body.classList.toggle('nav-open')">☰</button>
  <a class="brand" href="/"><img src="${LOGO}" alt="" width="28" height="28">Croner</a>
  <nav><a href="https://github.com/Hexagon/croner">GitHub</a><a href="/sponsors/">Sponsor</a></nav>
</header>
<div class="shell">
  <aside class="sidebar">
    <nav>${navList(children(), page)}</nav>
    <p>Repositories</p>
    <ul>${
    data.repos.map((r: { title: string; url: string }) => `<li><a href="${r.url}">${esc(r.title)}</a></li>`).join("")
  }</ul>
  </aside>
  <main>
    <article>${page.html}</article>
    ${pager(page)}
    <footer><a href="https://github.com/Hexagon/croner-site/edit/main/src/${page.src}">Edit this page</a><span>By <a href="https://github.com/Hexagon">Hexagon</a> and contributors</span></footer>
  </main>
  ${toc(page)}
</div>
</body>
</html>
`;

for (const page of pages) {
  const file = join(OUT, page.url.endsWith("/") ? page.url + "index.html" : page.url);
  await ensureDir(dirname(file));
  await Deno.writeTextFile(file, layout(page));
}
await Deno.writeTextFile(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    flat.map((p) => `<url><loc>${data.url}${p.url}</loc></url>`).join("\n")
  }\n</urlset>\n`,
);
console.log(`Built ${pages.length} pages to ${OUT}/`);

if (Deno.args.includes("--serve")) {
  Deno.serve({ port: 8000 }, (req) => serveDir(req, { fsRoot: OUT, quiet: true }));
}
