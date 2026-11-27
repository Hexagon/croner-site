// Code tabs: <div class="tabs" data-labels="A,B,..."> around code blocks shows one block at a time, with a button per
// label. The chosen tab is remembered across pages.
for (const box of document.querySelectorAll(".tabs[data-labels]")) {
  const blocks = [...box.querySelectorAll(":scope > pre")];
  const labels = box.dataset.labels.split(",");
  const bar = document.createElement("div");
  bar.className = "tab-bar";
  bar.setAttribute("role", "tablist");
  const show = (i) => {
    blocks.forEach((b, j) => (b.hidden = i !== j));
    [...bar.children].forEach((t, j) => t.setAttribute("aria-selected", String(i === j)));
  };
  blocks.forEach((_, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.textContent = labels[i] ?? `Example ${i + 1}`;
    button.onclick = () => {
      show(i);
      localStorage.setItem("croner-tab", button.textContent);
    };
    bar.append(button);
  });
  box.prepend(bar);
  box.classList.add("ready");
  const saved = labels.indexOf(localStorage.getItem("croner-tab"));
  show(saved < 0 ? 0 : saved);
}
