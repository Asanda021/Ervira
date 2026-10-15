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
      const cardText = normalize(card.textContent || "");
      const textMatches = !query || query.split(/\s+/).every(term => cardText.includes(term));
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


  // A locally generated draft can be saved without contacting a server.
  // Editing the form invalidates a previously prepared draft.
  form?.addEventListener("input", () => {
    if (result && !result.hidden) {
      result.hidden = true;
      if (output) output.value = "";
      if (status) status.textContent = "اطلاعات تغییر کرده است؛ برای ساخت پیش‌نویس تازه دکمه آماده‌سازی را بزنید. هیچ پیامی ارسال نشده است.";
    }
  });
  byId("briefDownload")?.addEventListener("click", () => {
    if (!output?.value || result?.hidden) return;
    const payload = new Blob(["\uFEFF", output.value, "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(payload);
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "ERVIRA-project-request.txt";
      anchor.style.display = "none";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      status.textContent = "فایل متن درخواست روی دستگاه شما آماده شد. این کار به معنی ارسال سفارش نیست.";
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });

  // Accessible motion: decorate elements only when IntersectionObserver is available.
  const motionIsReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (!motionIsReduced && "IntersectionObserver" in window) {
    const sections = document.querySelectorAll(
      ".section-intro,.solution-card,.work-card,.service-offer,.about-teaser-inner,.method-grid,.case-sections,.draft-grid article"
    );
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -24px 0px", threshold: 0.06 });
    for (const element of sections) {
      element.setAttribute("data-reveal", "");
      observer.observe(element);
    }
    document.documentElement.classList.add("motion-ready");
  }

  // Real color feedback on pointer/keyboard activation; persistent selection
  // remains tied to aria-pressed and aria-expanded, not to a decorative timer.
  const feedbackSelector = [
    "a.button", ".head-action", ".filter", ".nav-toggle",
    ".brief-form button", ".service-toc a", ".service-tabs a",
    ".service-view", ".stage-link", ".text-link"
  ].join(",");
  const pendingFeedback = new WeakMap();
  const isControl = target => target instanceof Element ? target.closest(feedbackSelector) : null;
  const holdFeedback = target => {
    const element = isControl(target);
    if (!element || element.matches(":disabled,[aria-disabled='true']")) return;
    clearTimeout(pendingFeedback.get(element));
    element.classList.add("is-pressing");
  };
  const releaseFeedback = target => {
    const element = isControl(target);
    if (!element) return;
    clearTimeout(pendingFeedback.get(element));
    pendingFeedback.set(element, setTimeout(() => element.classList.remove("is-pressing"), 170));
  };
  document.addEventListener("pointerdown", event => holdFeedback(event.target));
  document.addEventListener("pointerup", event => releaseFeedback(event.target));
  document.addEventListener("pointercancel", event => releaseFeedback(event.target));
  document.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") holdFeedback(event.target);
  });
  document.addEventListener("keyup", event => {
    if (event.key === "Enter" || event.key === " ") releaseFeedback(event.target);
  });
  window.addEventListener("blur", () => {
    document.querySelectorAll(".is-pressing").forEach(element => element.classList.remove("is-pressing"));
  });
})();
