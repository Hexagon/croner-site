// Page templates for scripts/build.ts. `doc` pages have the sidebar and table of contents; `home` (src/index.md)
// is a wider page without them.

export type Heading = { level: number; id: string; text: string };
export type Page = {
  src: string;
  url: string;
  title: string;
  description?: string;
  layout: string;
  html: string;
  headings: Heading[];
  group?: string;
};
export type NavItem = { page: Page; label: string };
export type Site = {
  title: string;
  description: string;
  url: string;
  version: string;
  nav: { title: string; items: NavItem[] }[];
  flat: NavItem[];
  repos: { title: string; lang: string; url: string }[];
};

export const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);

const ANALYTICS = "https://track.webpulseanalytics.com/client/653eb150048754e8b13f076e";

const icon = {
  mark:
    `<svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="16" cy="16" r="14" stroke="var(--brand)" stroke-width="2.6"/>
    <rect x="8.5" y="9" width="15" height="10.5" rx="1.6" stroke="currentColor" stroke-width="2"/>
    <path d="M16 19.5v3M12.5 23h7" stroke="currentColor" stroke-width="2"/>
    <path d="m12.6 14.4 2.3 2.3 4.5-4.5" stroke="var(--brand)" stroke-width="2.2"/></svg>`,
  github:
    `<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`,
  search:
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  theme:
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  menu:
    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
};

const header = (page: Page, site: Site) =>
  `<header class="top">
  <div class="top-inner">
    ${
    page.layout === "doc"
      ? `<button class="icon-button menu" type="button" aria-label="Open navigation">${icon.menu}</button>`
      : ""
  }
    <a class="brand" href="/">${icon.mark}<span>Croner</span></a>
    <nav class="top-links" aria-label="Main">
      <a href="/installation/"${page.src === "installation.md" ? ' aria-current="page"' : ""}>Installation</a>
      <a href="/usage/pattern/"${page.src === "usage/pattern.md" ? ' aria-current="page"' : ""}>Pattern</a>
      <a href="/usage/"${page.group === "JavaScript" ? ' aria-current="page"' : ""}>JavaScript</a>
    </nav>
    <button class="search-button" type="button" aria-label="Search">${icon.search}<span>Search</span><kbd>/</kbd></button>
    <button class="icon-button theme" type="button" aria-label="Switch between light and dark theme">${icon.theme}</button>
    <a class="icon-button" href="${site.repos[0].url}" aria-label="Croner on GitHub">${icon.github}</a>
  </div>
</header>`;

const sidebar = (page: Page, site: Site) =>
  `<aside class="sidebar" aria-label="Documentation">
  ${
    site.nav.map((group) =>
      `<p class="nav-title">${esc(group.title)}</p>
  <ul>${
        group.items.map(({ page: p, label }) =>
          `<li><a href="${p.url}"${p === page ? ' aria-current="page"' : ""}>${esc(label)}</a></li>`
        ).join("")
      }</ul>`
    ).join("\n  ")
  }
  <p class="nav-title">Repositories</p>
  <ul>${
    site.repos.map((r) =>
      `<li><a class="external" href="${r.url}">${esc(r.title)}<small>${esc(r.lang)}</small></a></li>`
    )
      .join("")
  }</ul>
</aside>`;

const toc = (page: Page) => {
  const items = page.headings.filter((h) => h.level === 2 || h.level === 3);
  if (items.length < 2) return "";
  const top = Math.min(...items.map((h) => h.level));
  return `<aside class="toc" aria-label="On this page"><p class="nav-title">On this page</p><ul>${
    items.map((h) => `<li${h.level > top ? ' class="sub"' : ""}><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")
  }</ul></aside>`;
};

const pager = (page: Page, site: Site) => {
  const i = site.flat.findIndex((item) => item.page === page);
  if (i < 0) return "";
  const link = (item: NavItem | undefined, rel: string, label: string) =>
    item
      ? `<a class="${rel}" href="${item.page.url}" rel="${rel}"><small>${label}</small>${esc(item.label)}</a>`
      : "<span></span>";
  return `<nav class="pager" aria-label="Previous and next page">${link(site.flat[i - 1], "prev", "Previous")}${
    link(site.flat[i + 1], "next", "Next")
  }</nav>`;
};

const footer = (site: Site) =>
  `<footer class="site-footer">
  <div class="footer-inner">
    <div>
      <a class="brand" href="/">${icon.mark}<span>Croner</span></a>
      <p>${esc(site.description)}.<br>Maintained by <a href="https://github.com/Hexagon">Hexagon</a> and
      <a href="https://github.com/Hexagon/croner/graphs/contributors">contributors</a>.</p>
    </div>
    <div><p class="nav-title">Documentation</p><ul>
      <li><a href="/installation/">Installation</a></li><li><a href="/usage/pattern/">Pattern</a></li>
      <li><a href="/usage/">JavaScript usage</a></li><li><a href="/migration/">Migration</a></li></ul></div>
    <div><p class="nav-title">Repositories</p><ul>${
    site.repos.map((r) => `<li><a href="${r.url}">${esc(r.title)}</a></li>`).join("")
  }</ul></div>
    <div><p class="nav-title">Project</p><ul>
      <li><a href="/contributing/">Contributing</a></li><li><a href="/sponsors/">Sponsorship</a></li>
      <li><a href="https://github.com/open-source-cron/ocps">OCPS</a></li>
      <li><a href="https://github.com/Hexagon/croner-site">Site source</a></li></ul></div>
  </div>
</footer>`;

const searchDialog = `<dialog class="search" aria-label="Search the documentation">
  <form method="dialog" class="search-box">${icon.search}<input type="search" placeholder="Search the documentation" autocomplete="off" spellcheck="false" aria-label="Search"><kbd>Esc</kbd></form>
  <ul class="results" role="listbox"></ul>
</dialog>`;

const doc = (page: Page, site: Site) =>
  `<div class="shell">
  ${sidebar(page, site)}
  <main id="main">
    <article class="content">
      ${page.group ? `<p class="eyebrow">${esc(page.group)}</p>` : ""}
      ${page.html}
    </article>
    ${pager(page, site)}
    <p class="edit"><a href="https://github.com/Hexagon/croner-site/edit/main/src/${page.src}">Edit this page on GitHub</a></p>
  </main>
  ${toc(page)}
</div>`;

const home = (page: Page) => `<main id="main" class="home"><article class="content">${page.html}</article></main>`;

export const layout = (page: Page, site: Site) => {
  const title = page.layout === "home" ? `${site.title}: ${site.description}` : `${page.title} | ${site.title}`;
  const description = page.description ?? site.description;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${site.url}${page.url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.title}">
<meta property="og:title" content="${esc(page.layout === "home" ? site.title : page.title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${site.url}${page.url}">
<meta property="og:image" content="${site.url}/assets/croner.png">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d1117" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/assets/mark.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/croner.png">
<link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css">
<script>document.documentElement.dataset.theme = localStorage.getItem("theme") ?? "";</script>
<script src="/assets/main.js" defer></script>
<script async type="module" src="${ANALYTICS}"></script>
</head>
<body class="layout-${page.layout}">
<a class="skip" href="#main">Skip to content</a>
${header(page, site)}
${page.layout === "home" ? home(page) : doc(page, site)}
${footer(site)}
${searchDialog}
</body>
</html>
`;
};
