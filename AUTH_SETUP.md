# ERVIRA Authentication Setup — P126

## هدف
ورود یکپارچه ERVIRA با:
- Google / Gmail
- Apple ID
- Email Magic Link

کد رابط و جریان احراز هویت در `account.html`، `js/auth.js` و `js/auth-config.js` آماده است.

## 1. ساخت پروژه Supabase
1. یک حساب در Supabase بساز.
2. یک Project جدید برای ERVIRA ایجاد کن.
3. بعد از آماده شدن پروژه، از بخش Project Settings > API فقط این دو مقدار عمومی را بردار:
   - Project URL
   - Publishable/Anon key
4. این دو مقدار در `js/auth-config.js` قرار می‌گیرند.

**هرگز Secret key / service_role key را داخل GitHub، مرورگر یا چت قرار نده.**

## 2. تنظیم URL
در Authentication > URL Configuration:
- Site URL: آدرس نهایی سایت ERVIRA
- Redirect URL: آدرس نهایی `/account.html`

برای مثال:
`https://ervira.ir/account.html`

## 3. Email
Email provider را فعال نگه دار.
ورود ایمیلی ERVIRA به‌صورت Magic Link انجام می‌شود و کاربر نیازی به ساخت یا حفظ رمز ندارد.

برای استفاده عمومی در مقیاس واقعی، SMTP اختصاصی پروژه باید تنظیم شود.

## 4. Google / Gmail
در Supabase Authentication > Providers > Google آن را فعال کن.
سپس در Google Cloud یک Web OAuth Client بساز و:
- Authorized JavaScript origin = دامنه نهایی ERVIRA
- Authorized redirect URI = Callback URL نمایش‌داده‌شده توسط Supabase

Client ID و Client Secret را فقط در پنل Supabase وارد کن؛ داخل GitHub قرار نمی‌گیرند.

## 5. Apple ID
در Apple Developer یک App ID و Services ID مناسب برای ورود وب ایجاد و Sign in with Apple را فعال کن.
سپس اطلاعات لازم Apple را در Provider مربوط به Apple در Supabase وارد کن.
Redirect/Website URL باید دقیقاً مطابق آدرس‌های پروژه تنظیم شود.

## 6. بعد از ساخت پروژه
برای ادامه کار توسعه فقط این دو مورد عمومی کافی است:
- Supabase Project URL
- Supabase Publishable/Anon key

Secretها را ارسال نکن.

## وضعیت
- UI ورود: آماده
- Google flow: آماده در کد
- Apple flow: آماده در کد
- Email Magic Link: آماده در کد
- Session persistence: آماده
- Dashboard auth gate: آماده
- Provider credentials: نیازمند تنظیم در حساب‌های مالک پروژه
- Production SMTP: نیازمند تنظیم قبل از استفاده عمومی



## P180–P189 Production Auth Gate
Before enabling Google, Apple, or production email delivery, verify Supabase Auth Site URL is `https://ervira.ir` and redirect URL is `https://ervira.ir/account.html`. Provider secrets must remain in Supabase/server configuration and never in GitHub or browser code. Perform a real login smoke test for each enabled provider before production activation.