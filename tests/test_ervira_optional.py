import importlib.util
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from PIL import Image
from pypdf import PdfReader, PdfWriter

SOURCE=Path(__file__).resolve().parents[1]/"public"/"automation"/"ervira_automation.py"
spec=importlib.util.spec_from_file_location("ervira_automation",SOURCE)
tools=importlib.util.module_from_spec(spec);spec.loader.exec_module(tools)


class OptionalLibraryExamples(unittest.TestCase):
    def setUp(self):
        t=tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.root=Path(t.name)

    def test_resize_preserves_ratio_and_original(self):
        src=self.root/"photos";src.mkdir()
        with Image.new("RGB",(120,60),"#1e6b5b") as im:
            im.save(src/"cover.jpg")
        dst=self.root/"output"
        n=tools.resize_images(SimpleNamespace(folder=str(src),dest=str(dst),width=80,apply=True))
        self.assertEqual(n,1)
        self.assertTrue((src/"cover.jpg").exists())
        with Image.open(dst/"cover.png") as image:
            self.assertEqual(image.size,(80,40))

    def test_resize_rejects_same_stem_targets_before_writing(self):
        src=self.root/"photos";src.mkdir()
        for name in ("same.jpg","same.png"):
            with Image.new("RGB",(50,50)) as im:
                im.save(src/name)
        dst=self.root/"target"
        with self.assertRaises(ValueError):
            tools.resize_images(SimpleNamespace(folder=str(src),dest=str(dst),width=30,apply=True))
        self.assertFalse(dst.exists())

    def test_pdf_split_and_merge(self):
        src=self.root/"two.pdf"
        writer=PdfWriter()
        writer.add_blank_page(width=300,height=400)
        writer.add_blank_page(width=300,height=400)
        with src.open("wb") as stream:
            writer.write(stream)
        directory=self.root/"pages"
        n=tools.pdf_pages(SimpleNamespace(mode="split",inputs=[str(src)],output=str(directory),apply=True))
        self.assertEqual(n,2)
        self.assertEqual(len(PdfReader(directory/"page_001.pdf").pages),1)
        dst=self.root/"merged.pdf"
        n=tools.pdf_pages(SimpleNamespace(mode="merge",inputs=[str(directory/"page_001.pdf"),str(directory/"page_002.pdf")],output=str(dst),apply=True))
        self.assertEqual(n,2)
        self.assertEqual(len(PdfReader(dst).pages),2)


if __name__=="__main__":
    unittest.main()
