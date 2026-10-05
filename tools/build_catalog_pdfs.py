#!/usr/bin/env python3
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.lib import colors
import arabic_reshaper
from bidi.algorithm import get_display

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "catalog" / "pdfs"
OUT.mkdir(parents=True, exist_ok=True)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
pdfmetrics.registerFont(TTFont("ERVIRA", FONT))
pdfmetrics.registerFont(TTFont("ERVIRA-Bold", BOLD))

def rtl(text):
    return get_display(arabic_reshaper.reshape(text))

products = {
    "StructuralPro": ("راهنمای جامع متره و برآورد کل ابنیه", "متره، برآورد، گزارش و خروجی پروژه برای کل ابنیه."),
    "StructureCalc": ("راهنمای حرفه‌ای StructureCalc", "آموزش مرحله‌ای محاسبات و گردش‌کار سازه."),
    "EstimatePro": ("راهنمای حرفه‌ای EstimatePro", "برآورد هزینه، قیمت‌گذاری و سناریوهای پروژه."),
    "OfficePro": ("راهنمای حرفه‌ای OfficePro", "گردش‌کار دفتر فنی، کنترل و مستندسازی."),
    "SitePro": ("راهنمای حرفه‌ای SitePro", "مدیریت عملیات، گزارش روزانه و پیشرفت کارگاه."),
    "EngineerAI": ("راهنمای حرفه‌ای EngineerAI", "دستیار هوشمند برای گردش‌کارهای مهندسی و اسناد پروژه."),
}

sections = [
    ("معرفی محصول", "این کاتالوگ مسیر استفاده، قابلیت‌ها، خروجی‌ها و مدل آموزشی محصول را معرفی می‌کند."),
    ("مسئله‌ای که حل می‌کند", "محصول برای کاهش کار تکراری، منظم‌کردن داده‌های پروژه و تولید خروجی قابل استفاده طراحی شده است."),
    ("مسیر استفاده", "تعریف پروژه، ورود اطلاعات، پردازش، کنترل نتیجه و تهیه گزارش نهایی."),
    ("قابلیت‌های کلیدی", "گردش‌کار تخصصی، گزارش‌گیری، خروجی‌های استاندارد و ساختار قابل توسعه در اکوسیستم ERVIRA."),
    ("Academy", "نسخه آموزشی شامل راهنمای مرحله‌به‌مرحله، تمرین عملی، نمونه خروجی، چک‌لیست و پرسش‌های متداول است."),
    ("نسخه و لایسنس", "Starter برای شروع، Professional برای استفاده حرفه‌ای و Team برای دفتر، شرکت و چند کاربر."),
]

styles = getSampleStyleSheet()
title = ParagraphStyle("title", fontName="ERVIRA-Bold", fontSize=24, leading=34, alignment=TA_RIGHT, textColor=colors.HexColor("#0b1727"), spaceAfter=16)
sub = ParagraphStyle("sub", fontName="ERVIRA", fontSize=12, leading=22, alignment=TA_RIGHT, textColor=colors.HexColor("#53697c"), spaceAfter=20)
head = ParagraphStyle("head", fontName="ERVIRA-Bold", fontSize=18, leading=28, alignment=TA_RIGHT, textColor=colors.HexColor("#1d6470"), spaceAfter=14)
body = ParagraphStyle("body", fontName="ERVIRA", fontSize=11, leading=23, alignment=TA_RIGHT, textColor=colors.HexColor("#405467"), spaceAfter=12)
note = ParagraphStyle("note", fontName="ERVIRA", fontSize=9, leading=18, alignment=TA_RIGHT, textColor=colors.HexColor("#718296"))

for name, (name_fa, subtitle) in products.items():
    path = OUT / f"{name}.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=46, leftMargin=46, topMargin=52, bottomMargin=45, title=f"ERVIRA Academy - {name}")
    story = []
    story += [Paragraph(rtl("ERVIRA ACADEMY"), ParagraphStyle("brand", fontName="ERVIRA-Bold", fontSize=10, alignment=TA_CENTER, textColor=colors.HexColor("#3c8b80"))),
              Spacer(1, 18), Paragraph(rtl(name_fa), title), Paragraph(rtl(subtitle), sub)]
    for idx, (section, text) in enumerate(sections, 1):
        story += [Paragraph(rtl(f"{idx:02d} / {section}"), head), Paragraph(rtl(text), body)]
        if idx in (2, 4, 6):
            story.append(Spacer(1, 16))
    story += [Spacer(1, 18), Paragraph(rtl("یادداشت انتشار: مشخصات نهایی قابلیت‌ها، حداقل سیستم و مدل لایسنس باید همزمان با انتشار رسمی همان نسخه تأیید شود."), note)]
    doc.build(story)
    print(path)
