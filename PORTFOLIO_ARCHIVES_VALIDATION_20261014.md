# تأیید بسته‌های نمونه‌کار ERVIRA برای انتشار

تاریخ بررسی: ۲۰۲۶-۱۰-۱۴

دو بسته زیر اکنون در ریشه مخزن `main` وجود دارند و محتوای آن‌ها با نسخه اصلی تولیدشده مقایسه شده است.

| بسته | SHA-256 | Git blob SHA-1 | اندازه |
|---|---|---|---:|
| `ERVIRA_10_Persian_Documents_Professional.zip` | `acc81b9d5cbcda8a8c95cf5070bc5874c32c8f2dff2fb608cb44588c5a05f844` | `96ed9e3d8b448714927c4eec9dea4db57400ba7b` | 1,065,902 B |
| `ERVIRA_10_Professional_Persian_Presentations.zip` | `afca4e6142dd56391bacc1b13d7c3712264e21643ff2e056f2570209b48e82ab` | `eb13178b19dc3bbb89b0ab60930734f0553c34aa` | 910,618 B |

## اعتبارسنجی مستقل
- هر ZIP در سطح CRC سالم است.
- اسناد: ۱۰ DOCX، ۱۰ PDF، ۱۰ WebP با امضا و ساختار داخلی معتبر.
- ارائه‌ها: ۱۰ PPTX، ۱۰ PDF، ۱۰ WebP با امضا و ساختار داخلی معتبر.
- دو گام `Verify and stage document portfolio` و `Verify and stage presentation portfolio` در `.github/workflows/pages.yml` پیش از `upload-pages-artifact` تعریف شده‌اند.
- بارگذاری اولیه هر دو ZIP با Commit دارای `[skip ci]` انجام شده بود. این تغییر برای فعال کردن اجرای عادی چرخه انتشار GitHub Pages بدون عبارت `[skip ci]` تهیه شده است.

## مرز نتیجه
ثبت فایل و تطابق هش **به‌معنای تأیید دانلود از دامنه نیست**. انتشار موفق در GitHub Actions و آزمایش عمومی لینک‌های `/documents/downloads/` و `/presentations/downloads/` باید جداگانه تأیید شوند.

نمونه‌ها مستقل و با داده آزمایشی هستند؛ ادعای سفارش‌دهنده واقعی ندارند.
