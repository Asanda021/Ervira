import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from decimal import Decimal
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "automation" / "ervira_automation.py"
spec = importlib.util.spec_from_file_location("ervira_automation", SOURCE)
tool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tool)


class AutomationSamples(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name)

    def csv(self, name, body):
        p = self.path / name
        p.write_text(body, encoding="utf-8")
        return str(p)

    def args(self, **kw):
        return SimpleNamespace(**kw)

    def test_decimal_rejects_nan(self):
        with self.assertRaises(ValueError):
            tool.safe_decimal("NaN")
        self.assertEqual(tool.safe_decimal("1,250.40"), Decimal("1250.40"))

    def test_rename_is_preview_first(self):
        d = self.path / "files"; d.mkdir()
        (d/"file A.txt").write_text("a")
        n = tool.numbered_rename(self.args(folder=str(d), prefix="proj", start=1, apply=False))
        self.assertEqual(n, 1)
        self.assertTrue((d/"file A.txt").exists())
        self.assertFalse((d/"proj_001.txt").exists())
        tool.numbered_rename(self.args(folder=str(d), prefix="proj", start=1, apply=True))
        self.assertEqual((d/"proj_001.txt").read_text(), "a")

    def test_csv_report(self):
        f = self.csv("src.csv", "group,amount\nA,20\nB,30\nA,7.5\n")
        dst = self.path/"report.html"
        tool.csv_report(self.args(input=f, output=str(dst), group="group", amount="amount", apply=True))
        txt = dst.read_text()
        self.assertIn("27.50", txt)
        self.assertIn('lang="fa"', txt)

    def test_csv_merge_and_refuse_schema_mismatch(self):
        a = self.csv("a.csv", "code,amount\n1,2\n")
        b = self.csv("b.csv", "code,amount\n2,4\n")
        c = self.csv("c.csv", "code,price\n3,9\n")
        dst = str(self.path/"merged.csv")
        with self.assertRaises(ValueError):
            tool.merge_csv(self.args(inputs=[a,c], output=dst, apply=True))
        tool.merge_csv(self.args(inputs=[a,b], output=dst, apply=True))
        _, rows = tool.input_csv(dst)
        self.assertEqual(len(rows), 2)

    def test_invoice_calculation(self):
        f = self.csv("invoice.csv", "item,quantity,unit_price\nA,2,100\nB,1,50\n")
        dst = str(self.path/"invoice.html")
        tool.invoice_html(self.args(input=f, output=dst, tax_percent="10", apply=True))
        self.assertIn("275.00", Path(dst).read_text())

    def test_duplicate_hash_does_not_delete(self):
        a = self.path/"a.txt"; b = self.path/"b.txt"
        a.write_text("same");b.write_text("same")
        self.assertEqual(tool.duplicates(self.args(folder=str(self.path),output=None, apply=False)),1)
        self.assertTrue(a.exists() and b.exists())

    def test_organize_preview_then_apply(self):
        f = self.path/"notes.txt"; f.write_text("abc")
        tool.organize_folder(self.args(folder=str(self.path), apply=False))
        self.assertTrue(f.exists())
        tool.organize_folder(self.args(folder=str(self.path), apply=True))
        self.assertEqual((self.path/"txt"/"notes.txt").read_text(),"abc")

    def test_validate_csv(self):
        f=self.csv("people.csv","id,email\n1,a@example.test\n2,broken-email\n")
        n=tool.validate_csv(self.args(input=f,required="id,email",email_column="email",output=None,apply=False))
        self.assertEqual(n,1)

    def test_reconcile_fails_closed_duplicate_id(self):
        left=self.csv("left.csv","id,amount\nA,10\nA,11\n")
        right=self.csv("right.csv","id,amount\nA,10\n")
        with self.assertRaises(ValueError):
            tool.reconcile(self.args(left=left,right=right,output=str(self.path/"out.json"),apply=True))
        self.assertFalse((self.path/"out.json").exists())

    def test_reconcile_amount_diff(self):
        left=self.csv("left.csv","id,amount\nA,10\nB,20\n")
        right=self.csv("right.csv","id,amount\nA,12\nC,30\n")
        dest=self.path/"out.json"
        self.assertEqual(tool.reconcile(self.args(left=left,right=right,output=str(dest),apply=True)),3)
        out=json.loads(dest.read_text())
        self.assertEqual({x["issue"] for x in out["issues"]}, {"only_left","only_right","amount_mismatch"})

    def test_output_never_overwrites(self):
        p=self.path/"report.txt"; p.write_text("old")
        with self.assertRaises(FileExistsError):
            tool.write_new(p,"new",apply=True)
        self.assertEqual(p.read_text(),"old")


if __name__=="__main__":
    unittest.main()
