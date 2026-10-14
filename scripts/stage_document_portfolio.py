#!/usr/bin/env python3
"""Stage ERVIRA's verified DOCX/PDF/WebP portfolio archive for GitHub Pages.

Run by Pages workflow after checkout. Fail-closed on any invalid archive, while
leaving the existing public site unchanged when the archive is not present.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, BadZipFile

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / "ERVIRA_10_Persian_Documents_Professional.zip"
PUBLIC = ROOT / "public" / "documents"
EXPECTED_BUNDLE_SHA256 = "acc81b9d5cbcda8a8c95cf5070bc5874c32c8f2dff2fb608cb44588c5a05f844"

BASENAMES = (
    "01_Executive_Performance_Report",
    "02_Data_Analysis_Proposal",
    "03_Professional_Resume_Template",
    "04_Meeting_Minutes_Action_Log",
    "05_Service_Agreement_Layout_Sample",
    "06_Field_Inspection_Report",
    "07_Digital_Services_Catalog",
    "08_Persian_Editing_Before_After",
    "09_Editable_Table_Reconstruction",
    "10_Persian_Business_Correspondence",
)
FORMATS = {
    "docx": ("documents", "downloads"),
    "pdf": ("pdf", "downloads"),
    "webp": ("previews", "previews"),
}
ALLOWED_EXTRAS = {"README_FA.md", "qa/report.json"}
MAX_UNCOMPRESSED_BYTES = 6_000_000


def verify_signature(raw: bytes, suffix: str) -> bool:
    if suffix == "docx":
        if raw[:4] != b"PK\x03\x04":
            return False
        try:
            from io import BytesIO
            with ZipFile(BytesIO(raw)) as nested:
                return nested.testzip() is None and "word/document.xml" in nested.namelist()
        except BadZipFile:
            return False
    if suffix == "pdf":
        return raw.startswith(b"%PDF-") and b"%%EOF" in raw[-2048:]
    if suffix == "webp":
        return raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"
    return False


def main() -> None:
    if not ARCHIVE.is_file():
        print("Portfolio document archive not uploaded yet; leaving downloads pending.")
        return

    zip_hash = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
    if zip_hash != EXPECTED_BUNDLE_SHA256:
        raise RuntimeError("Archive SHA-256 mismatch. Refusing to publish changed documents.")

    expected = {
        f"{folder}/{name}.{ext}"
        for name in BASENAMES
        for ext, (folder, _) in FORMATS.items()
    }
    staged: list[tuple[Path, bytes]] = []
    manifest: list[dict[str, object]] = []
    with ZipFile(ARCHIVE) as z:
        infos = z.infolist()
        names = [entry.filename for entry in infos]
        if len(names) != len(set(names)):
            raise ValueError("Archive contains duplicate file paths.")
        if set(names) != expected | ALLOWED_EXTRAS:
            raise ValueError(
                f"Unexpected ZIP paths. Missing: {sorted(expected-set(names))}; "
                f"Extra: {sorted(set(names)-expected-ALLOWED_EXTRAS)}"
            )
        if sum(x.file_size for x in infos) > MAX_UNCOMPRESSED_BYTES:
            raise ValueError("Archive exceeds approved uncompressed size.")
        if z.testzip() is not None:
            raise ValueError("Corrupted ZIP member.")
        for name in BASENAMES:
            for ext, (source_dir, target_dir) in FORMATS.items():
                source = f"{source_dir}/{name}.{ext}"
                raw = z.read(source)
                if not verify_signature(raw, ext):
                    raise ValueError(f"Invalid file signature: {source}")
                dest = PUBLIC / target_dir / f"{name}.{ext}"
                staged.append((dest, raw))
                manifest.append({
                    "file": dest.relative_to(ROOT / "public").as_posix(),
                    "sha256": hashlib.sha256(raw).hexdigest(),
                    "bytes": len(raw),
                    "sample_kind": "independent_educational",
                })

    for target, raw in staged:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
    file_list = PUBLIC / "downloads" / "manifest.json"
    file_list.write_text(
        json.dumps({"bundle_sha256": zip_hash, "files": manifest},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Staged {len(staged)} verified portfolio assets for Pages.")


if __name__ == "__main__":
    main()
