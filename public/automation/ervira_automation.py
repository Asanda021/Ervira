#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ten reproducible, offline freelance automation samples; no network or AI-generated facts.
Python 3.10+. PIL/Pillow and pypdf are optional only for their respective commands.
Mutating commands default to preview-only and require --apply.
"""
from __future__ import annotations
import argparse
import csv
from collections import defaultdict
from decimal import Decimal, InvalidOperation
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
from typing import Iterable


def safe_decimal(value: str) -> Decimal:
    try:
        result = Decimal(str(value).replace(",", "").strip())
        if not result.is_finite():
            raise ValueError("Non-finite number")
        return result
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("Invalid numeric input: " + repr(value)) from exc


def input_csv(path: str) -> tuple[list[str], list[dict[str, str]]]:
    fp = Path(path)
    if not fp.is_file() or fp.stat().st_size > 20_000_000:
        raise ValueError("CSV must exist and be at most 20 MB")
    with fp.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not reader.fieldnames or any(not k for k in reader.fieldnames):
            raise ValueError("Missing/blank CSV header")
        if len(reader.fieldnames) != len(set(reader.fieldnames)):
            raise ValueError("Duplicate CSV headers")
        rows = []
        for index, row in enumerate(reader, 1):
            if index > 100_000:
                raise ValueError("Too many rows")
            if None in row:
                raise ValueError("CSV row has more fields than header")
            rows.append(row)
    return list(reader.fieldnames), rows


def require_cols(cols, required):
    missing = set(required) - set(cols)
    if missing:
        raise ValueError("Required columns missing: " + ", ".join(sorted(missing)))


def write_new(path: str | Path, content: str, *, apply: bool):
    dst = Path(path)
    if dst.exists():
        raise FileExistsError("Refusing to overwrite: " + str(dst))
    if not apply:
        print("PREVIEW output:", dst)
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    with dst.open("x", encoding="utf-8") as fh:
        fh.write(content)
    print("CREATED:", dst)


def clean_name(text):
    result = re.sub(r"[^0-9A-Za-zآ-ی._ -]+", "_", text).strip(" .")
    return result[:90] or "file"


def numbered_rename(args):
    folder = Path(args.folder)
    if not folder.is_dir():
        raise ValueError("Folder does not exist")
    items = sorted(x for x in folder.iterdir() if x.is_file() and not x.is_symlink())
    plans = [(src, folder / f"{clean_name(args.prefix)}_{n:03}{src.suffix.lower()}")
             for n, src in enumerate(items, args.start)]
    targets = [dst for _, dst in plans]
    if len(targets) != len(set(targets)):
        raise ValueError("Duplicate target names")
    existing = set(folder.iterdir()) - {src for src, _ in plans}
    if any(dst in existing for dst in targets):
        raise FileExistsError("Target collides with unrelated file")
    for src, dst in plans:
        print(f"{src.name} => {dst.name}")
    if args.apply:
        # Two-phase rename prevents cross-collisions and rollback is possible on error.
        staged = []
        try:
            for i, (src, dst) in enumerate(plans):
                tmp = folder / f".ervira-rename-stage-{i:08x}"
                if tmp.exists():
                    raise FileExistsError(tmp)
                src.rename(tmp); staged.append((src, tmp, dst))
            for src, tmp, dst in staged:
                tmp.rename(dst)
        except Exception:
            for src, tmp, dst in reversed(staged):
                if tmp.exists():
                    tmp.rename(src)
                elif dst.exists() and not src.exists():
                    dst.rename(src)
            raise
    return len(plans)


def html_document(title, inner):
    return ('<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<style>body{font-family:Tahoma,sans-serif;max-width:1000px;margin:35px auto;padding:15px;'
            'color:#22382f;line-height:2}h1{border-bottom:3px solid #1b6b57;padding-bottom:15px}'
            'table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:9px 12px;'
            'border:1px solid #cddfd5;text-align:right}th{background:#dceee3}'
            'tr:nth-child(2n){background:#f4f9f5}@media print{body{max-width:none}}'
            '</style><title>' + html.escape(title) + '</title></head><body><h1>'
            + html.escape(title) + '</h1>' + inner + '</body></html>')


def csv_report(args):
    cols, rows = input_csv(args.input)
    require_cols(cols, [args.group, args.amount])
    sums = defaultdict(Decimal)
    for row in rows:
        sums[row[args.group].strip() or "(خالی)"] += safe_decimal(row[args.amount])
    body = '<p>داده نمونه، دسته‌بندی و جمع عددی دقیق با Decimal.</p><table><thead><tr><th>دسته</th><th>جمع</th></tr></thead><tbody>'
    body += ''.join('<tr><td>' + html.escape(k) + '</td><td>' + f'{v:,.2f}' + '</td></tr>'
                    for k, v in sorted(sums.items()))
    body += '</tbody></table><p>تعداد ردیف‌ها: ' + str(len(rows)) + '</p>'
    write_new(args.output, html_document("گزارش گروه‌بندی داده", body), apply=args.apply)
    return len(rows)


def merge_csv(args):
    if len(args.inputs) < 2:
        raise ValueError("At least two CSV inputs required")
    base, all_rows = input_csv(args.inputs[0])
    out_abs = Path(args.output).resolve()
    if any(Path(p).resolve() == out_abs for p in args.inputs):
        raise ValueError("Output cannot replace source")
    for name in args.inputs[1:]:
        cols, rows = input_csv(name)
        if cols != base:
            raise ValueError("CSV schemas differ: " + name)
        all_rows.extend(rows)
    from io import StringIO
    stream = StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=base, lineterminator="\n")
    writer.writeheader(); writer.writerows(all_rows)
    write_new(args.output, "\ufeff" + stream.getvalue(), apply=args.apply)
    return len(all_rows)


def invoice_html(args):
    cols, rows = input_csv(args.input)
    require_cols(cols, ["item", "quantity", "unit_price"])
    tax = safe_decimal(args.tax_percent)
    if tax < 0 or tax > 100:
        raise ValueError("Tax percent out of range")
    details, net = [], Decimal(0)
    for row in rows:
        quantity, price = safe_decimal(row["quantity"]), safe_decimal(row["unit_price"])
        if quantity <= 0 or price < 0:
            raise ValueError("Invalid invoice quantity or price")
        subtotal = quantity * price; net += subtotal
        details.append('<tr><td>' + html.escape(row["item"]) + '</td><td>' +
                       str(quantity) + '</td><td>' + f'{price:,.2f}' + '</td><td>' +
                       f'{subtotal:,.2f}' + '</td></tr>')
    total = net * (Decimal(1) + tax/100)
    body = '<p>پیش‌فاکتور آموزشی؛ سند مالیاتی یا فاکتور رسمی نیست.</p><table><tr><th>شرح</th><th>تعداد</th><th>بهای واحد</th><th>جمع</th></tr>' + ''.join(details) + '</table>'
    body += f'<p>جمع پایه: {net:,.2f} | مالیات ورودی: {tax}% | جمع نهایی: {total:,.2f}</p>'
    write_new(args.output, html_document("پیش‌فاکتور آموزشی", body), apply=args.apply)
    return len(rows)


def resize_images(args):
    if args.width < 20 or args.width > 4000:
        raise ValueError("Width out of range")
    try:
        from PIL import Image, ImageOps
    except ImportError as e:
        raise RuntimeError("Install Pillow for image resizing: pip install Pillow") from e
    src = Path(args.folder); dest = Path(args.dest)
    if not src.is_dir() or src.resolve() == dest.resolve():
        raise ValueError("Source/destination must be distinct")
    images = [p for p in sorted(src.iterdir()) if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg"}]
    for p in images:
        target = dest / (p.stem + ".png")
        if target.exists():
            raise FileExistsError(target)
        if args.apply:
            dest.mkdir(parents=True, exist_ok=True)
            with Image.open(p) as im:
                im = ImageOps.exif_transpose(im).convert("RGB")
                height = max(1, round(im.height * min(args.width / im.width, 1)))
                width = min(args.width, im.width)
                im.resize((width, height), Image.Resampling.LANCZOS).save(target, "PNG")
        print(("CREATED" if args.apply else "PREVIEW"), target)
    return len(images)


def pdf_pages(args):
    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError as e:
        raise RuntimeError("Install pypdf for PDF operation: pip install pypdf") from e
    if args.mode == "merge":
        if len(args.inputs) < 2:
            raise ValueError("Merge requires two input PDFs")
        writer = PdfWriter()
        for p in args.inputs:
            if not Path(p).is_file():
                raise FileNotFoundError(p)
            reader = PdfReader(p)
            if reader.is_encrypted:
                raise ValueError("Encrypted PDF unsupported")
            writer.append(reader)
        if Path(args.output).exists():
            raise FileExistsError(args.output)
        if args.apply:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            with open(args.output, "xb") as f:
                writer.write(f)
        print(("CREATED" if args.apply else "PREVIEW"), args.output)
        return len(writer.pages)
    if len(args.inputs) != 1:
        raise ValueError("Split requires exactly one PDF")
    reader = PdfReader(args.inputs[0])
    if reader.is_encrypted:
        raise ValueError("Encrypted PDF unsupported")
    folder = Path(args.output)
    targets = [folder / f"page_{i:03}.pdf" for i in range(1, len(reader.pages)+1)]
    if any(x.exists() for x in targets):
        raise FileExistsError("Page output collision")
    for i, target in enumerate(targets):
        if args.apply:
            folder.mkdir(parents=True, exist_ok=True)
            writer = PdfWriter(); writer.add_page(reader.pages[i])
            with target.open("xb") as out:
                writer.write(out)
        print(("CREATED" if args.apply else "PREVIEW"), target)
    return len(targets)


def organize_folder(args):
    root = Path(args.folder)
    if not root.is_dir():
        raise ValueError("Folder not found")
    entries = [x for x in root.iterdir() if x.is_file() and not x.is_symlink()]
    plan = [(p, root / (p.suffix.lower().lstrip(".") or "no-extension") / p.name)
            for p in sorted(entries)]
    if any(dst.exists() for _, dst in plan):
        raise FileExistsError("A destination already exists")
    for src, dst in plan:
        if args.apply:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dst))
        print(("MOVED" if args.apply else "PREVIEW"), src.name, "=>", dst)
    return len(plan)


def file_hash(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    return h.hexdigest()


def duplicates(args):
    root = Path(args.folder)
    if not root.is_dir():
        raise ValueError("Folder not found")
    groups = defaultdict(list)
    for f in sorted(root.rglob("*")):
        if f.is_file() and not f.is_symlink():
            groups[(f.stat().st_size, file_hash(f))].append(str(f))
    dup = [v for v in groups.values() if len(v) > 1]
    report = {"duplicate_sets": dup, "sets": len(dup), "policy": "Never delete files automatically."}
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        write_new(args.output, text + "\n", apply=args.apply)
    else:
        print(text)
    return len(dup)


def validate_csv(args):
    cols, rows = input_csv(args.input)
    required = [p.strip() for p in args.required.split(",") if p.strip()]
    require_cols(cols, required)
    problems = []
    for n, row in enumerate(rows, 2):
        for col in required:
            if not (row[col] or "").strip():
                problems.append({"line": n, "column": col, "issue": "blank"})
        if args.email_column:
            val = (row.get(args.email_column) or "").strip()
            if val and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", val):
                problems.append({"line": n, "column": args.email_column, "issue": "email-format"})
    result = {"rows": len(rows), "errors": problems, "valid": not problems}
    text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        write_new(args.output, text + "\n", apply=args.apply)
    else:
        print(text)
    return len(problems)


def reconcile(args):
    h1, left = input_csv(args.left)
    h2, right = input_csv(args.right)
    require_cols(h1, ["id", "amount"]); require_cols(h2, ["id", "amount"])
    def indexed(rows, label):
        result = {}
        for row in rows:
            key = row["id"].strip()
            if not key or key in result:
                raise ValueError("Empty/duplicate identity in " + label)
            result[key] = safe_decimal(row["amount"])
        return result
    a, b = indexed(left, "left"), indexed(right, "right")
    issues = []
    for key in sorted(a.keys() | b.keys()):
        if key not in a:
            issues.append({"id": key, "issue": "only_right", "amount": str(b[key])})
        elif key not in b:
            issues.append({"id": key, "issue": "only_left", "amount": str(a[key])})
        elif a[key] != b[key]:
            issues.append({"id": key, "issue": "amount_mismatch", "left": str(a[key]), "right": str(b[key])})
    text = json.dumps({"left_rows": len(a), "right_rows": len(b), "issues": issues}, ensure_ascii=False, indent=2)
    write_new(args.output, text + "\n", apply=args.apply)
    return len(issues)


def main(argv=None):
    parser = argparse.ArgumentParser(description="ERVIRA independent offline automation demos")
    sub = parser.add_subparsers(dest="command", required=True)
    def cmd(name, func, note):
        p = sub.add_parser(name, help=note); p.set_defaults(func=func); return p
    def add_apply(p):
        p.add_argument("--apply", action="store_true", help="Explicitly write output; default preview")
    a = cmd("rename", numbered_rename, "Number files safely"); a.add_argument("folder"); a.add_argument("--prefix", default="sample"); a.add_argument("--start", type=int, default=1); add_apply(a)
    a = cmd("csv-report", csv_report, "Aggregate CSV into RTL HTML report"); a.add_argument("input"); a.add_argument("output"); a.add_argument("--group", required=True); a.add_argument("--amount", required=True); add_apply(a)
    a = cmd("merge-csv", merge_csv, "Merge CSV files with identical schema"); a.add_argument("output"); a.add_argument("inputs", nargs="+"); add_apply(a)
    a = cmd("invoice", invoice_html, "Generate printable invoice HTML (demo)"); a.add_argument("input"); a.add_argument("output"); a.add_argument("--tax-percent", default="0"); add_apply(a)
    a = cmd("resize-images", resize_images, "Resize pictures to PNG (needs Pillow)"); a.add_argument("folder"); a.add_argument("dest"); a.add_argument("--width", type=int, required=True); add_apply(a)
    a = cmd("pdf-pages", pdf_pages, "Merge or split PDF (needs pypdf)"); a.add_argument("mode", choices=["merge","split"]); a.add_argument("output"); a.add_argument("inputs", nargs="+"); add_apply(a)
    a = cmd("organize", organize_folder, "Sort folder files into extension folders"); a.add_argument("folder"); add_apply(a)
    a = cmd("duplicates", duplicates, "Find SHA-256 duplicate files; never deletes"); a.add_argument("folder"); a.add_argument("--output"); add_apply(a)
    a = cmd("validate", validate_csv, "CSV schema and required value diagnostics"); a.add_argument("input"); a.add_argument("--required", required=True); a.add_argument("--email-column"); a.add_argument("--output"); add_apply(a)
    a = cmd("reconcile", reconcile, "Reconcile two financial CSV lists by unique id"); a.add_argument("left"); a.add_argument("right"); a.add_argument("output"); add_apply(a)
    args = parser.parse_args(argv)
    try:
        n = args.func(args)
    except (OSError, ValueError, RuntimeError) as exc:
        parser.exit(2, "ERROR: " + str(exc) + "\n")
    print("RESULT:", n)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
