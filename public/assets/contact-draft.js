/* ERVIRA local project-request draft. Never transmits data to a server. */
(() => {
  "use strict";
  const form = document.getElementById("projectRequestDraft");
  if (!form) return;
  const details = document.getElementById("requestDescription");
  const category = document.getElementById("requestCategory");
  const deliverable = document.getElementById("requestDeliverable");
  const deadline = document.getElementById("requestDeadline");
  const preview = document.getElementById("requestPreview");
  const feedback = document.getElementById("requestStatus");
  const copy = document.getElementById("copyRequest");
  const draft = () => [
    "موضوع: درخواست بررسی پروژه دیجیتال",
    "حوزه: " + category.value,
    "شرح کار: " + details.value.trim(),
    "خروجی موردنظر: " + (deliverable.value.trim() || "نیازمند هماهنگی"),
    "زمان پیشنهادی: " + (deadline.value.trim() || "تعیین پس از بررسی"),
    "",
    "این متن صرفاً پیش‌نویس است و از طریق سایت ارسال نشده است."
  ].join("\n");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const body = details.value.trim();
    if (body.length < 15) {
      feedback.textContent = "لطفاً شرح کار را حداقل در ۱۵ نویسه بنویسید.";
      details.focus(); return;
    }
    preview.value = draft();
    copy.disabled = false;
    feedback.textContent = "پیش‌نویس آماده شد. هنوز هیچ پیامی ارسال نشده است.";
  });
  copy.addEventListener("click", async () => {
    if (!preview.value) return;
    try {
      await navigator.clipboard.writeText(preview.value);
      feedback.textContent = "متن کپی شد؛ ارسال سفارش هنوز انجام نشده است.";
    } catch {
      preview.focus(); preview.select();
      feedback.textContent = "متن انتخاب شد. آن را دستی کپی کنید.";
    }
  });
})();
