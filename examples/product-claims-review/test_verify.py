import json
import subprocess
import sys
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from verify import EXAMPLE, check, read_json, read_sources


class ClaimsReviewTest(unittest.TestCase):
    def setUp(self):
        self.sample = read_json(EXAMPLE / "sample-review.json")
        self.reference = read_json(EXAMPLE / "acceptance.json")
        self.sources = read_sources(EXAMPLE / "workspace" / "SOURCES.md")

    def validate(self):
        return check(self.sample, self.reference, self.sources)

    def test_sample(self):
        self.assertEqual(self.validate(), [])

    def test_archived_evidence_beside_current_evidence(self):
        self.sample["claims"][1]["evidence"].append(
            {"source_id": "CARE-04", "quote": "The bottle body is dishwasher safe."}
        )
        self.assertTrue(
            any("CARE-04 is inapplicable" in problem for problem in self.validate())
        )

    def test_extra_evidence_for_another_claim(self):
        self.sample["claims"][1]["evidence"].extend(
            self.sample["claims"][0]["evidence"]
        )
        self.assertTrue(
            any("ENG-17 is inapplicable" in problem for problem in self.validate())
        )

    def test_unsubstantiated_copy(self):
        self.sample["claims"][1]["proposed_copy"] = (
            "Dishwasher safe, including the bottle body."
        )
        self.assertTrue(
            any("copy is unsupported" in problem for problem in self.validate())
        )

    def test_missing_side_of_conflict(self):
        self.sample["claims"][2]["evidence"].pop()
        self.assertTrue(any("QA-08" in problem for problem in self.validate()))

    def test_approved_conflict(self):
        self.sample["claims"][2]["decision"] = "approve"
        self.assertTrue(
            any("decision disagrees" in problem for problem in self.validate())
        )

    def test_rejects_secondary_decision_at_each_level(self):
        for level in ("report", "claim", "evidence"):
            with self.subTest(level=level):
                report = deepcopy(self.sample)
                held = report["claims"][2]
                target = {
                    "report": report,
                    "claim": held,
                    "evidence": held["evidence"][0],
                }[level]
                target["final_decision"] = "approve"
                problems = check(report, self.reference, self.sources)
                self.assertTrue(
                    any(
                        "unexpected field" in p and "final_decision" in p
                        for p in problems
                    )
                )

    def test_json_rejects_nonstandard_numbers(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "review.json"
            for value in ("NaN", "Infinity", "-Infinity"):
                with self.subTest(value=value):
                    path.write_text('{"decision": ' + value + "}", encoding="utf-8")
                    with self.assertRaisesRegex(ValueError, "invalid JSON number"):
                        read_json(path)

    def test_custom_packet_at_cli(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "SOURCES.md").write_text(
                "### QC-2 · Tray check\nBlue insert fitted.\n### ENG-8 · Assembly instruction\nFit a gray insert.\n",
                encoding="utf-8",
            )
            fixture = {
                "sku": "DESK-42",
                "revision": "3",
                "cases": {
                    "COLOR": {
                        "decision": "hold",
                        "copy": "Desk tray.",
                        "requires": {
                            "QC-2": ["Blue insert fitted."],
                            "ENG-8": ["Fit a gray insert."],
                        },
                        "question_requirements": {
                            "colors": ["blue"],
                            "second color": ["gray", "grey"],
                        },
                    }
                },
            }
            (folder / "acceptance.json").write_text(
                json.dumps(fixture), encoding="utf-8"
            )
            row = {
                "id": "COLOR",
                "decision": "hold",
                "proposed_copy": "Desk tray.",
                "evidence": [
                    {"source_id": "QC-2", "quote": "Blue insert fitted."},
                    {"source_id": "ENG-8", "quote": "Fit a gray insert."},
                ],
                "operator_question": "Can you check whether the insert should be blue or grey?",
            }
            report = {"sku": "DESK-42", "revision": "3", "claims": [row]}
            path = folder / "review.json"
            command = [
                sys.executable,
                str(EXAMPLE / "verify.py"),
                str(path),
                "--packet",
                str(folder),
            ]
            path.write_text(json.dumps(report), encoding="utf-8")
            result = subprocess.run(
                command, check=False, capture_output=True, text=True
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("1 claim checked", result.stdout)
            row["operator_question"] = "Should we use blue?"
            path.write_text(json.dumps(report), encoding="utf-8")
            result = subprocess.run(
                command, check=False, capture_output=True, text=True
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("second color", result.stderr)


if __name__ == "__main__":
    unittest.main()
