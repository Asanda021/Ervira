import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public");
const requiredPages = ["index.html", "services.html", "about.html", "cases/sales-dashboard.html", "portfolio/index.html"];
const read = file => fs.readFileSync(path.join(root, file), "utf8");
for (const file of requiredPages) assert.ok(fs.existsSync(path.join(root, file)), `Missing public page: ${file}`);

const homepage = read("index.html");
assert.match(homepage, /<html lang="fa" dir="rtl">/);
assert.match(homepage, /name="robots" content="index,follow"/i);
assert.match(homepage, /canonical" href="https:\/\/ervira\.ir\//);
assert.match(homepage, /نمونه‌ها مستقل و آموزشی‌اند/);
assert.doesNotMatch(homepage, /StructuralPro|فروشگاه محصولات نرم‌افزاری/);
assert.match(homepage, /href="about\.html"/);
assert.match(homepage, /id="workSearch"/, "Portfolio must offer a working search field");
assert.match(homepage, /id="workCount"/, "Portfolio must show its real visible result count");



// Standalone reference-first preview: no change to public homepage until owner approval.
const phase1Preview = read("previews/homepage-phase1.html");
assert.match(phase1Preview, /name="robots" content="noindex,nofollow"/, "Phase 1 must not be indexed before approval");
assert.match(phase1Preview, /id="selected"/);
assert.match(phase1Preview, /id="services"/);
assert.match(phase1Preview, /id="navToggle"/);
assert.equal((phase1Preview.match(/class="case-media"/g) || []).length, 3, "Exactly three large case studies are required");
assert.equal((phase1Preview.match(/class="service-row"/g) || []).length, 5, "Exactly five service lines are required");
assert.match(phase1Preview, /نمونه‌های فعلی مستقل و آموزشی‌اند/);
assert.doesNotMatch(phase1Preview, /StructuralPro|مشتریان ما|رضایت مشتریان/i);
for (const [, href] of phase1Preview.matchAll(/\b(?:href|src)="(\/[^"]+)"/g)) {
  const local = href.split(/[?#]/)[0].replace(/^\//, "");
  if (!local) continue;
  const target = path.join(root, local);
  assert.ok(fs.existsSync(target) || fs.existsSync(path.join(target, "index.html")), "Preview link missing: " + href);
}

const gallery = read("portfolio/index.html");
assert.match(gallery, /<html lang="fa" dir="rtl">/, "Gallery must be Persian RTL");
assert.equal((gallery.match(/class="folio-card(?: folio-feature)?"/g)||[]).length,30,"Gallery must include 30 actual sample cards");
assert.match(read("sitemap.xml"), /https:\/\/ervira\.ir\/portfolio\//, "Gallery must be indexed");
for(const [,href] of gallery.matchAll(/(?:href|src)="(\/(?!\/)[^"]+)"/g)){
 const local=href.split(/[?#]/,1)[0].replace(/^\//,"");
 if(!local)continue;
 const dest=path.join(root,local);
 assert.ok(fs.existsSync(dest)||fs.existsSync(path.join(dest,"index.html")), "Gallery asset missing: "+href);
}

const services = read("services.html");
assert.match(services, /name="robots" content="index,follow"/i);
assert.equal((services.match(/data-service="[^"]+"/g) || []).length, 8, "Eight transparent service areas are required");
for (const id of ["excel-data", "word-pdf", "powerpoint", "graphic-design", "website-ui", "automation", "writing", "civil-office"])
  assert.match(services, new RegExp(`id="${id}"`), `Missing service detail ${id}`);
assert.match(services, /نمونه‌های عمران.*در حال آماده‌سازی/s);

const about = read("about.html");
assert.match(about, /نیازمند تأیید مالک/);
assert.match(about, /name="robots" content="noindex,nofollow"/i);
assert.doesNotMatch(about, /محمد سلطانی|hello@ervira\.ir|\+?98\d{8,}|(?:۰|0)9\d{9}/);

const casePage = read("cases/sales-dashboard.html");
assert.match(casePage, /نمونه مستقل/);
assert.match(casePage, /data آزمایشی|داده آزمایشی/);
assert.match(casePage, /01_ERVIRA_Sales_Intelligence\.xlsx/);
assert.match(casePage, /01_Dashboard_Preview\.png/);

for (const file of requiredPages) {
  const html = read(file);
  for (const [, href] of html.matchAll(/\b(?:href|src)="(\/(?!\/)[^"]+)"/g)) {
    const local = href.split(/[?#]/, 1)[0].replace(/^\//, "");
    if (local && !path.extname(local)) assert.ok(fs.existsSync(path.join(root, local, "index.html")), `${file}: missing route ${href}`);
    else if (local) assert.ok(fs.existsSync(path.join(root, local)), `${file}: missing asset ${href}`);
  }
}

const documentManifest = JSON.parse(read("documents/downloads/manifest.json"));
const presentationManifest = JSON.parse(read("presentations/downloads/manifest.json"));
assert.equal(documentManifest.files.length, 30);
assert.equal(presentationManifest.files.length, 30);
for (const entry of [...documentManifest.files, ...presentationManifest.files]) {
  const file = path.join(root, entry.file || entry.path);
  assert.ok(fs.existsSync(file), `Manifest file missing: ${entry.file || entry.path}`);
  const data = fs.readFileSync(file);
  assert.equal(data.length, entry.bytes, `Byte count mismatch: ${file}`);
  assert.equal(crypto.createHash("sha256").update(data).digest("hex"), entry.sha256, `SHA-256 mismatch: ${file}`);
  const ext = path.extname(file).toLowerCase();
  if ([".docx", ".pptx"].includes(ext)) assert.equal(data.subarray(0, 4).toString("hex"), "504b0304", `${file}: invalid ZIP signature`);
  if (ext === ".pdf") assert.equal(data.subarray(0, 5).toString(), "%PDF-", `${file}: invalid PDF signature`);
  if (ext === ".webp") assert.equal(data.subarray(8, 12).toString(), "WEBP", `${file}: invalid WebP signature`);
}
const excelFiles = fs.readdirSync(path.join(root, "excel/downloads")).filter(name => name.endsWith(".xlsx"));
assert.equal(excelFiles.length, 10, "All ten editable Excel samples must be present");
for (const file of ["index.html", "services.html", "cases/sales-dashboard.html"]) {
  assert.match(read(file), /<meta name="description"/i, `${file}: missing description`);
  assert.match(read(file), /<link rel="canonical" href="https:\/\/ervira\.ir\//i, `${file}: missing canonical URL`);
  assert.match(read(file), /<meta name="robots" content="index,follow"/i, `${file}: missing public indexing policy`);
}
assert.doesNotMatch(read("sitemap.xml"), /ervira\.ir\/(?:products|account|pricing|checkout|dashboard)/i, "The public freelance sitemap must not advertise legacy product/store routes");
assert.doesNotMatch(read("sitemap.xml"), /ervira\.ir\/about\.html/i, "The owner draft must stay out of search listings");

if (process.env.ERVIRA_SKIP_BROWSER === "1") {
  console.log("PASS: static routes, Persian metadata, live sample manifests and SHA-256; browser checks explicitly skipped.");
  process.exit(0);
}

const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const outputDir = path.resolve("site-qa");
fs.mkdirSync(outputDir, { recursive: true });
const pages = ["/", "/services.html", "/portfolio/", "/previews/homepage-phase1.html", "/about.html", "/cases/sales-dashboard.html"];
const widths = [320, 375, 430, 768, 1024, 1440];
const errors = [];
try {
  for (const width of widths) {
    for (const route of pages) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce", acceptDownloads: true });
      page.on("pageerror", error => errors.push(`${route} ${width}: ${error}`));
      const response = await page.goto(`http://127.0.0.1:8765${route}`, { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200, `${route} did not load at ${width}px`);
      await page.evaluate(async () => {
        for (const img of document.images) {
          img.loading = "eager";
          await new Promise(resolve => {
            if (img.complete) return resolve();
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 7000);
          });
        }
      });
      const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
      assert.ok(dimensions.document <= dimensions.viewport + 1, `${route} horizontal overflow at ${width}px (${dimensions.document}/${dimensions.viewport})`);
      if (route === "/") {
        assert.equal(await page.locator(".work-card").count(), 6);
        if (width <= 768) {
          await page.locator("#navToggle").click();
          assert.equal(await page.locator("#navToggle").getAttribute("aria-expanded"), "true");
          await page.locator("#siteNav a[href='#selected']").click();
          assert.equal(await page.locator("#navToggle").getAttribute("aria-expanded"), "false");
        }
        // Verify visible color feedback, not just click handlers or CSS strings.
        if (width === 375) {
          const heroButton = page.locator(".hero-buttons .button").first();
          await heroButton.scrollIntoViewIfNeeded();
          await heroButton.hover();
          await page.mouse.down();
          assert.equal(await heroButton.evaluate(element =>
            getComputedStyle(element).backgroundColor), "rgb(166, 75, 32)",
            "Pressed button must visibly change to copper, including on touch-sized screens");
          await page.mouse.up();
          await page.waitForTimeout(240);
          assert.ok(!(await heroButton.evaluate(element =>
            element.classList.contains("is-pressing"))), "Click feedback must be temporary");
          assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
        }
        await page.locator('[data-filter="digital"]').click();
        assert.equal(await page.locator(".work-card:visible").count(), 2);
        await page.locator('[data-filter="all"]').click();
        assert.equal(await page.locator(".work-card:visible").count(), 6);
        await page.locator("#workSearch").fill("داشبورد فروش");
        assert.equal(await page.locator(".work-card:visible").count(), 1);
        assert.match(await page.locator("#workCount").textContent(), /۱/);
        await page.locator("#workSearch").fill("متن غیرموجود");
        assert.ok(await page.locator("#workEmpty").isVisible());
        await page.locator("#workSearch").fill("");
        assert.equal(await page.locator(".work-card:visible").count(), 6);
        await page.locator("#briefNeed").fill("فایل‌های هفتگی فروش باید در یک گزارش روشن کنار هم قرار بگیرند.");
        await page.locator("#briefForm button[type=submit]").click();
        assert.ok((await page.locator("#briefPreview").inputValue()).includes("از سایت ارسال یا ثبت نشده است"));
        if (width === 375) {
          await page.locator("#briefNeed").fill("گزارش فروش هر ماه باید با ورودی جدید ویرایش و دوباره آماده شود.");
          assert.ok(await page.locator("#briefResult").isHidden(), "Stale draft must be invalidated after edits");
          await page.locator("#briefForm button[type=submit]").click();
          const requestDownload = page.waitForEvent("download");
          await page.locator("#briefDownload").click();
          const download = await requestDownload;
          assert.equal(download.suggestedFilename(), "ERVIRA-project-request.txt");
          assert.match(await page.locator("#briefStatus").textContent(), /به معنی ارسال سفارش نیست/);
        }
      }
      if (route === "/previews/homepage-phase1.html") {
        assert.equal(await page.locator(".case-media").count(), 3, "Preview needs three real project images");
        assert.equal(await page.locator(".service-row").count(), 5, "Preview needs five services");
        const images = await page.locator(".case-media img").evaluateAll(list => list.map(img => img.complete && img.naturalWidth > 0));
        assert.ok(images.every(Boolean), "All featured case thumbnails must be real, loadable assets");
        assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "noindex,nofollow");
        const hero = page.locator(".hero h1");
        assert.ok(await hero.isVisible(), "Hero headline is visible");
      }
      if (route === "/portfolio/") {
        assert.equal(await page.locator(".folio-card").count(), 30, "Expected thirty rendered project tiles");
        assert.equal(await page.locator(".folio-card:visible").count(), 30);
        assert.ok(await page.locator(".folio-card img").first().evaluate(img => img.complete && img.naturalWidth>0), "Real portfolio preview failed to load");
        await page.locator('[data-kind-filter="document"]').click();
        assert.equal(await page.locator(".folio-card:visible").count(),10,"Documents filter");
        await page.locator('[data-kind-filter="all"]').click();
        await page.locator("#folioSearch").fill("گانت");
        assert.equal(await page.locator(".folio-card:visible").count(),1,"Search must match project title");
        await page.locator("#folioSearch").fill("نمونه‌ای وجود ندارد");
        assert.ok(await page.locator("#folioEmpty").isVisible(),"Empty result message required");
        await page.locator("#folioSearch").fill("");
        assert.equal(await page.locator(".folio-card:visible").count(),30);
        await page.locator(".folio-zoom").first().click();
        assert.equal(await page.locator("#folioModal").evaluate(el=>el.open),true,"Preview dialog should open");
        await page.locator("#folioClose").click();
        assert.equal(await page.locator("#folioModal").evaluate(el=>el.open),false,"Preview dialog should close");
      }
      if (route === "/services.html") assert.equal(await page.locator("[data-service]").count(), 8);
      if (width <= 768 && route !== "/") {
        await page.locator("#navToggle").click();
        assert.equal(await page.locator("#navToggle").getAttribute("aria-expanded"), "true", `${route}: mobile navigation did not open`);
        const navId = route === "/previews/homepage-phase1.html" ? "#mainNav" : "#siteNav";
        assert.ok(await page.locator(navId).isVisible(), `${route}: open mobile navigation is hidden`);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#navToggle").getAttribute("aria-expanded"), "false", `${route}: Escape did not close navigation`);
      }
      if (route === "/previews/homepage-phase1.html") await page.locator("#navToggle").evaluate(el => el.blur());
      if (width === 375 || width === 1440) {
        const label = route === "/" ? "home" : route.replaceAll("/", "-").replaceAll(".", "-") || "home";
        await page.screenshot({ path: path.join(outputDir, `${label}-${width}.png`), fullPage: true, animations: "disabled" });
      }
      await page.close();
    }
  }
  // Separate motion-enabled browser run: reduced-motion QA alone cannot prove animation works.
  const motionPage = await browser.newPage({ viewport: { width: 1280, height: 820 }, reducedMotion: "no-preference" });
  try {
    await motionPage.goto("http://127.0.0.1:8765/", { waitUntil: "domcontentloaded" });
    const animationNames = await motionPage.evaluate(() => ({
      glow: getComputedStyle(document.querySelector(".hero-sheen")).animationName,
      float: getComputedStyle(document.querySelector(".hero-stage .stage-window")).animationName
    }));
    assert.match(animationNames.glow, /ervira-glow/, "Hero glow must actually animate");
    assert.match(animationNames.float, /ervira-float/, "Hero showcase must actually animate");
    await motionPage.locator(".solution-card").first().scrollIntoViewIfNeeded();
    await motionPage.waitForFunction(() => document.querySelector(".solution-card")?.classList.contains("is-visible"),
      undefined, { timeout: 6000 });
    assert.ok(await motionPage.locator(".solution-card").first().evaluate(element =>
      element.getAttribute("data-reveal") !== null), "Actual viewport reveal must be initialized");
  } finally {
    await motionPage.close();
  }
  assert.equal(errors.length, 0, `JavaScript errors: ${errors.join("; ")}`);
  for (const [file, expected] of [["excel/downloads/01_ERVIRA_Sales_Intelligence.xlsx", "PK\u0003\u0004"], ["documents/downloads/01_Executive_Performance_Report.pdf", "%PDF-"], ["presentations/downloads/01_Quarterly_Performance.pptx", "PK\u0003\u0004"]]) {
    const data = fs.readFileSync(path.join(root, file));
    assert.equal(data.subarray(0, expected.length).toString(), expected, `Download bytes invalid: ${file}`);
  }
  console.log(`PASS: ERVIRA studio routes, 8 services, safe owner draft, 60 verified Word/PowerPoint assets, 10 Excel files, and ${widths.length} real browser widths.`);
} finally {
  await browser.close();
}
