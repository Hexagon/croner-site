// Theme toggle, mobile navigation, code tabs, copy buttons, search and the active table of contents entry.

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Theme: follows the system until toggled, then remembered.
$(".theme")?.addEventListener("click", () => {
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  const current = document.documentElement.dataset.theme || (dark ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
});

// Mobile navigation.
$(".menu")?.addEventListener("click", () => document.body.classList.toggle("nav-open"));
$$(".sidebar a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));

// Tabs: code blocks with a title in <div class="tabs">. The chosen tab is remembered across pages.
for (const tabs of $$(".tabs")) {
  const panels = $$(":scope > .code[data-title]", tabs);
  const list = document.createElement("div");
  list.className = "tab-list";
  list.setAttribute("role", "tablist");
  const select = (title, save) => {
    const panel = panels.find((p) => p.dataset.title === title) ?? panels[0];
    panels.forEach((p) => (p.hidden = p !== panel));
    $$("button", list).forEach((b) => b.setAttribute("aria-selected", String(b.textContent === panel.dataset.title)));
    if (save) localStorage.setItem("tab", panel.dataset.title);
  };
  for (const panel of panels) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.textContent = panel.dataset.title;
    button.addEventListener("click", () => {
      select(panel.dataset.title, true);
      $$(".tabs").forEach((other) => other !== tabs && other.selectTab?.(panel.dataset.title));
    });
    list.append(button);
  }
  tabs.selectTab = (title) => panels.some((p) => p.dataset.title === title) && select(title);
  tabs.prepend(list);
  select(localStorage.getItem("tab"));
}

// Copy buttons.
document.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy");
  if (!button) return;
  await navigator.clipboard.writeText($("pre", button.closest(".code")).innerText.replace(/\n$/, ""));
  button.textContent = "Copied";
  setTimeout(() => (button.textContent = "Copy"), 1500);
});

// Search: press / or Ctrl+K. Every word must match the page title, section heading or text.
const dialog = $("dialog.search");
const input = $("input", dialog);
const results = $(".results", dialog);
let index, active = 0;

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const mark = (text, words) =>
  words.length ? escape(text).replace(new RegExp(`(${words.map((w) => escape(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi"), "<mark>$1</mark>") : escape(text);
const excerpt = (text, words) => {
  const at = Math.max(0, Math.min(...words.map((w) => text.toLowerCase().indexOf(w)).filter((i) => i >= 0)) - 40);
  return (at > 0 ? "…" : "") + text.slice(at, at + 160) + (text.length > at + 160 ? "…" : "");
};

const render = () => {
  const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length || !index) return (results.innerHTML = "");
  const hits = index.map((s) => {
    const title = `${s.page} ${s.heading}`.toLowerCase(), text = s.text.toLowerCase();
    if (!words.every((w) => title.includes(w) || text.includes(w))) return null;
    return { s, score: words.reduce((n, w) => n + (title.includes(w) ? 10 : 0) + (text.includes(w) ? 1 : 0), 0) };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 12);
  active = 0;
  results.innerHTML = hits.length
    ? hits.map(({ s }, i) =>
      `<li role="option"${i === 0 ? ' aria-selected="true"' : ""}><a href="${s.url}"><span class="result-title"><span>${
        mark(s.heading || s.page, words)
      }</span>${s.heading ? `<small>${escape(s.page)}</small>` : ""}</span><span class="result-text">${
        mark(excerpt(s.text, words), words)
      }</span></a></li>`
    ).join("")
    : `<li class="empty">No results for “${escape(input.value)}”</li>`;
};

const openSearch = async () => {
  dialog.showModal();
  input.select();
  index ??= await fetch("/search.json").then((r) => r.json());
  render();
};
$(".search-button")?.addEventListener("click", openSearch);
input.addEventListener("input", render);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
  if (event.target.closest("a")) dialog.close();
});
input.addEventListener("keydown", (event) => {
  const items = $$("li[role=option]", results);
  if (event.key === "Enter") {
    event.preventDefault();
    items[active] && $("a", items[active]).click();
    return;
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp" || !items.length) return;
  event.preventDefault();
  items[active].removeAttribute("aria-selected");
  active = (active + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
  items[active].setAttribute("aria-selected", "true");
  items[active].scrollIntoView({ block: "nearest" });
});
document.addEventListener("keydown", (event) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if ((event.key === "/" && !typing) || (event.key === "k" && (event.metaKey || event.ctrlKey))) {
    event.preventDefault();
    openSearch();
  }
});

// Highlight the section in view in the table of contents.
const tocLinks = $$(".toc a");
if (tocLinks.length) {
  const targets = tocLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  const update = () => {
    let current = targets[0];
    for (const t of targets) if (t.getBoundingClientRect().top < 120) current = t;
    tocLinks.forEach((a) => a.classList.toggle("active", a.hash.slice(1) === current?.id));
  };
  addEventListener("scroll", update, { passive: true });
  update();
}
