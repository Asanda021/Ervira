#!/usr/bin/env python3
"""Stage exactly 30 verified presentation assets for the ERVIRA Pages site."""
from __future__ import annotations
import hashlib
import json
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile, BadZipFile

ROOT=Path(__file__).resolve().parent.parent
ARCHIVE=ROOT/"ERVIRA_10_Professional_Persian_Presentations.zip"
PUBLIC=ROOT/"public"/"presentations"
EXPECTED_SHA="afca4e6142dd56391bacc1b13d7c3712264e21643ff2e056f2570209b48e82ab"
BASENAMES=(
 "01_Quarterly_Performance",
 "02_Research_Defense",
 "03_Company_Profile",
 "04_Startup_Pitch",
 "05_Digital_Product_Intro",
 "06_Marketing_Plan",
 "07_Excel_Training",
 "08_Project_Progress",
 "09_Product_Roadmap",
 "10_Technical_Proposal",
)
FORMATS={"pptx":("slides","downloads"),"pdf":("pdf","downloads"),"webp":("previews","previews")}
EXTRAS={"README_FA.md","manifest.json","qa_results.json"}
MAX_BYTES=10_000_000

def signature_ok(data:bytes,ext:str)->bool:
 if ext=="pdf":
  return data.startswith(b"%PDF-") and b"%%EOF" in data[-2048:]
 if ext=="webp":
  return len(data)>20 and data[:4]==b"RIFF" and data[8:12]==b"WEBP"
 if ext=="pptx":
  if data[:4]!=b"PK\x03\x04": return False
  try:
   with ZipFile(BytesIO(data)) as z:
    return z.testzip() is None and "ppt/presentation.xml" in z.namelist()
  except BadZipFile:
   return False
 return False

def main():
 if not ARCHIVE.is_file():
  print("Presentation ZIP not uploaded yet; existing site remains unchanged.")
  return
 raw=ARCHIVE.read_bytes()
 sha=hashlib.sha256(raw).hexdigest()
 if sha!=EXPECTED_SHA:raise RuntimeError("Bundle SHA mismatch. Refusing deployment.")
 expected={f"{src}/{name}.{ext}" for name in BASENAMES for ext,(src,_) in FORMATS.items()}
 with ZipFile(BytesIO(raw)) as z:
  members=z.infolist()
  names=[m.filename for m in members]
  if len(names)!=len(set(names)):raise ValueError("Duplicate ZIP paths")
  if set(names)!=expected|EXTRAS:raise ValueError("Unexpected/missing ZIP entries")
  if any(m.file_size>2_000_000 for m in members) or sum(m.file_size for m in members)>MAX_BYTES:raise ValueError("Size limit exceeded")
  if z.testzip() is not None:raise ValueError("ZIP CRC failure")
  verified=[]
  manifest=[]
  for name in BASENAMES:
   for ext,(src,dest) in FORMATS.items():
    key=f"{src}/{name}.{ext}"
    contents=z.read(key)
    if not signature_ok(contents,ext):raise ValueError("Invalid media file "+key)
    target=PUBLIC/dest/f"{name}.{ext}"
    verified.append((target,contents))
    manifest.append({"path":str(target.relative_to(ROOT/"public")).replace("\\","/"),"sha256":hashlib.sha256(contents).hexdigest(),"bytes":len(contents)})
 # All files verified before the first write.
 for target,contents in verified:
  target.parent.mkdir(parents=True,exist_ok=True)
  target.write_bytes(contents)
 (PUBLIC/"downloads"/"manifest.json").write_text(json.dumps({"bundle_sha256":sha,"files":manifest},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(f"Staged {len(verified)} verified presentation assets.")

if __name__=="__main__":main()
