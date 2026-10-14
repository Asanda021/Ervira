import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const html=fs.readFileSync("public/index.html","utf8");
const js=fs.readFileSync("public/assets/contact-draft.js","utf8");
const css=fs.readFileSync("public/assets/polish.css","utf8");
assert.doesNotThrow(()=>new vm.Script(js));
for(const id of ["projectRequestDraft","requestDescription","requestCategory","requestDeliverable","requestDeadline","requestPreview","copyRequest","requestStatus"]){
 assert.match(html,new RegExp('id="'+id+'"'),"Missing "+id);
}
assert.match(html,/role="status" aria-live="polite"/);
assert.match(html,/maxlength="900"/);
assert.match(html,/readonly/);
assert.match(html,/این فرم فقط در مرورگر شما پیش‌نویس می‌سازد/);
assert.ok(!html.includes('href="mailto:hello@ervira.ir'),"Unverified mailbox must not be offered as live contact");
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/.test(js),"Draft must not transmit or persist data");
assert.ok(css.includes(".contact-draft-panel"));
console.log("PASS: local-only contact draft, Persian labels, accessible preview, no false-send claim");
