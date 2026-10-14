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
  const filters = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll("[data-category]")];
  filters.forEach(button => button.addEventListener("click", () => {
    const category = button.dataset.filter;
    filters.forEach(item => {
      const selected = item === button;
      item.setAttribute("aria-pressed", String(selected));
      item.classList.toggle("active", selected);
    });
    cards.forEach(card => { card.hidden = category !== "all" && card.dataset.category !== category; });
  }));
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