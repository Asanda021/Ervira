#!/usr/bin/env python3
"""Check all published portfolio file responses against their manifests."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent / "public"
BASE = "http://127.0.0.1:8765"
EXPECTED_TYPES = {
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".pdf": "application/pdf",
    ".webp": "image/webp",
    ".png": "image/png",
}


def signature(path: Path, data: bytes) -> bool:
    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".docx", ".pptx"}:
        if data[:4] != b"PK\x03\x04":
            return False
        with ZipFile(path) as archive:
            if archive.testzip() is not None:
                return False
            marker = {".xlsx": "xl/workbook.xml", ".docx": "word/document.xml", ".pptx": "ppt/presentation.xml"}[suffix]
            return marker in archive.namelist()
    if suffix == ".pdf":
        return data.startswith(b"%PDF-") and b"%%EOF" in data[-2048:]
    if suffix == ".webp":
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    if suffix == ".png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    return False


def get_manifest_paths(file_name: str, key: str) -> list[str]:
    manifest = json.loads((ROOT / file_name).read_text(encoding="utf-8"))
    entries = manifest["files"]
    paths = [entry[key] for entry in entries]
    if len(paths) != 30:
        raise AssertionError(f"{file_name}: expected 30 files, got {len(paths)}")
    for entry in entries:
        path_value = entry[key]
        file_path = ROOT / path_value
        raw = file_path.read_bytes()
        if len(raw) != entry["bytes"]:
            raise AssertionError(f"Byte count mismatch: {path_value}")
        if hashlib.sha256(raw).hexdigest() != entry["sha256"]:
            raise AssertionError(f"SHA-256 mismatch: {path_value}")
    return paths


paths = [
    *[f"excel/downloads/{p.name}" for p in sorted((ROOT / "excel/downloads").glob("*.xlsx"))],
    *[f"excel/previews/{p.name}" for p in sorted((ROOT / "excel/previews").glob("*.png"))],
    *get_manifest_paths("documents/downloads/manifest.json", "file"),
    *get_manifest_paths("presentations/downloads/manifest.json", "path"),
]
if len(paths) != 80:
    raise AssertionError(f"Expected 80 downloadable/preview files, got {len(paths)}")

for relative in paths:
    local = ROOT / relative
    expected = EXPECTED_TYPES[local.suffix.lower()]
    request = Request(f"{BASE}/{relative}", method="GET")
    with urlopen(request, timeout=15) as response:
        if response.status != 200:
            raise AssertionError(f"HTTP {response.status}: {relative}")
        content_type = response.headers.get_content_type()
        data = response.read()
        if content_type != expected:
            raise AssertionError(f"MIME mismatch {relative}: expected {expected}, got {content_type}")
        if int(response.headers.get("Content-Length", "-1")) != len(data):
            raise AssertionError(f"Content-Length mismatch: {relative}")
        if len(data) != local.stat().st_size:
            raise AssertionError(f"Served size mismatch: {relative}")
        if not signature(local, data):
            raise AssertionError(f"Invalid file signature or archive CRC: {relative}")

print("PASS: 80 HTTP file responses (10 XLSX, 10 PNG, 30 documents, 30 presentations), MIME, size, SHA-256, signatures and ZIP CRC.")
