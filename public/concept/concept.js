(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const toggle = byId("navToggle");
  const nav = byId("siteNav");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "بستن فهرست" : "باز کردن فهرست");
    nav?.classList.toggle("open", open);
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "باز کردن فهرست");
  }));
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || toggle?.getAttribute("aria-expanded") !== "true") return;
    nav?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "باز کردن فهرست");
    toggle?.focus();
  });
  const filters = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll("[data-category]")];
  const search = byId("workSearch");
  const count = byId("workCount");
  const empty = byId("workEmpty");
  let selectedCategory = "all";
  const normalize = text => text.normalize("NFKC").replace(/[يى]/g, "ی").replace(/ك/g, "ک").trim().toLocaleLowerCase("fa-IR");
  const updateCards = () => {
    const query = normalize(search?.value || "");
    let visible = 0;
    cards.forEach(card => {
      const categoryMatches = selectedCategory === "all" || card.dataset.category === selectedCategory;
      const textMatches = !query || normalize(card.textContent || "").includes(query);
      const show = categoryMatches && textMatches;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (count) count.textContent = `${visible.toLocaleString("fa-IR")} نمونه قابل نمایش`;
    if (empty) empty.hidden = visible !== 0;
  };
  filters.forEach(button => button.addEventListener("click", () => {
    selectedCategory = button.dataset.filter || "all";
    filters.forEach(item => {
      const selected = item === button;
      item.setAttribute("aria-pressed", String(selected));
      item.classList.toggle("active", selected);
    });
    updateCards();
  }));
  search?.addEventListener("input", updateCards);
  updateCards();
  const form = byId("briefForm");
  const input = byId("briefNeed");
  const output = byId("briefPreview");
  const result = byId("briefResult");
  const status = byId("briefStatus");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const details = input.value.trim();
    if ([...details].length < 15) {
      status.textContent = "شرح پروژه باید حداقل ۱۵ نویسه داشته باشد.";
      input.focus();
      return;
    }
    output.value = [
      "درخواست بررسی پروژه",
      "حوزه: " + byId("briefKind").value,
      "شرح نیاز: " + details,
      "خروجی مطلوب: " + (byId("briefOutput").value.trim() || "نیازمند بررسی"),
      "مهلت پیشنهادی: " + (byId("briefTime").value.trim() || "پس از هماهنگی"),
      "",
      "این متن پیش‌نویس است و از سایت ارسال یا ثبت نشده است."
    ].join("\n");
    result.hidden = false;
    status.textContent = "پیش‌نویس آماده شد. برای استفاده از آن، متن را کپی کنید. پیام ارسال نشده است.";
  });
  byId("briefCopy")?.addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = "متن درخواست کپی شد. ارسال پیام به مقصد هنوز انجام نشده است.";
    } catch {
      output.focus();
      output.select();
      status.textContent = "متن انتخاب شده است. آن را به‌صورت دستی کپی کنید.";
    }
  });
})();
