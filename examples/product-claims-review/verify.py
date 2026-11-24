"""Check one local claims review against the reference decisions and source packet."""

import argparse
import json
import re
import sys
from pathlib import Path

EXAMPLE = Path(__file__).resolve().parent


def unique_fields(pairs):
    fields = {}
    for key, value in pairs:
        if key in fields:
            raise ValueError(f"duplicate JSON field {key!r}")
        fields[key] = value
    return fields


def reject_nonstandard_number(value):
    raise ValueError(f"invalid JSON number {value}")


def read_json(path):
    return json.loads(
        path.read_text(encoding="utf-8"),
        object_pairs_hook=unique_fields,
        parse_constant=reject_nonstandard_number,
    )


def unexpected_fields(record, allowed, location):
    return [
        f"{location}: unexpected field {key!r}"
        for key in sorted(record.keys() - allowed)
    ]


def read_sources(path):
    sources = {}
    for part in re.split(
        r"^### ", path.read_text(encoding="utf-8"), flags=re.MULTILINE
    )[1:]:
        heading, _, body = part.partition("\n")
        source_id = heading.split(" · ", 1)[0]
        if source_id in sources:
            raise ValueError(f"duplicate source ID {source_id}")
        sources[source_id] = body.strip()
    return sources


def check_evidence(case_id, evidence, requirements, sources):
    errors = []
    supported = set()
    if not isinstance(evidence, list):
        return [f"{case_id}: evidence must be a list"]
    for entry in evidence:
        if not isinstance(entry, dict):
            errors.append(f"{case_id}: evidence entries must be objects")
            continue
        errors.extend(
            unexpected_fields(entry, {"source_id", "quote"}, f"{case_id} evidence")
        )
        source_id, quote = entry.get("source_id"), entry.get("quote")
        if not isinstance(source_id, str) or source_id not in sources:
            errors.append(f"{case_id}: unknown or missing source ID")
            continue
        if source_id not in requirements:
            errors.append(
                f"{case_id}: {source_id} is inapplicable to this release decision"
            )
            continue
        if (
            not isinstance(quote, str)
            or not quote.strip()
            or quote not in sources[source_id]
        ):
            errors.append(f"{case_id}: quote is absent from {source_id}")
            continue
        if not any(line in quote for line in requirements[source_id]):
            errors.append(
                f"{case_id}: quotation from {source_id} does not establish this claim"
            )
            continue
        supported.add(source_id)
    for missing in sorted(set(requirements) - supported):
        errors.append(f"{case_id}: cite the decisive evidence from {missing}")
    return errors


def check_question(case_id, question, expected):
    if expected["decision"] != "hold":
        return (
            []
            if question is None
            else [f"{case_id}: closed decision has an open question"]
        )
    if not isinstance(question, str) or "?" not in question:
        return [f"{case_id}: include a question the local operator can resolve"]
    missing = []
    for label, alternatives in expected["question_requirements"].items():
        if not any(
            re.search(r"(?<!\w)" + re.escape(term) + r"(?!\w)", question, re.IGNORECASE)
            for term in alternatives
        ):
            missing.append(label)
    return (
        [f"{case_id}: operator question needs {', '.join(missing)}"] if missing else []
    )


def validate_packet(reference, sources):
    if not isinstance(reference, dict) or not all(
        isinstance(reference.get(key), str) and reference[key].strip()
        for key in ("sku", "revision")
    ):
        raise ValueError("acceptance.json needs a SKU and revision")
    cases = reference.get("cases")
    if not isinstance(cases, dict) or not cases:
        raise ValueError("acceptance.json needs at least one case")
    for case_id, case in cases.items():
        if not isinstance(case, dict) or case.get("decision") not in (
            "approve",
            "revise",
            "hold",
        ):
            raise ValueError(f"{case_id}: invalid reference decision")
        if not isinstance(case.get("copy"), str) or not case["copy"].strip():
            raise ValueError(f"{case_id}: missing reference copy")
        requirements = case.get("requires")
        if not isinstance(requirements, dict) or not requirements:
            raise ValueError(f"{case_id}: missing reference evidence requirements")
        for source_id, options in requirements.items():
            if source_id not in sources or not valid_options(options):
                raise ValueError(
                    f"{case_id}: invalid source or quotations for {source_id}"
                )
            if any(quote not in sources[source_id] for quote in options):
                raise ValueError(
                    f"{case_id}: expected quotation absent from {source_id}"
                )
        if case["decision"] == "hold":
            questions = case.get("question_requirements")
            if (
                not isinstance(questions, dict)
                or not questions
                or not all(valid_options(options) for options in questions.values())
            ):
                raise ValueError(
                    f"{case_id}: hold requires question_requirements with alternative terms"
                )


def valid_options(options):
    return (
        isinstance(options, list)
        and bool(options)
        and all(isinstance(option, str) and option.strip() for option in options)
    )


def check(report, reference, sources):
    if not isinstance(report, dict) or not isinstance(report.get("claims"), list):
        return ["top level must be an object containing a claims list"]
    errors = unexpected_fields(report, {"sku", "revision", "claims"}, "report")
    for field in ("sku", "revision"):
        if report.get(field) != reference[field]:
            errors.append(f"incorrect or missing {field}")
    seen = set()
    for claim in report["claims"]:
        case_id = claim.get("id") if isinstance(claim, dict) else None
        if not isinstance(case_id, str) or case_id not in reference["cases"]:
            errors.append("unknown or missing claim ID")
            continue
        if case_id in seen:
            errors.append(f"{case_id}: duplicate decision")
            continue
        seen.add(case_id)
        errors.extend(
            unexpected_fields(
                claim,
                {"id", "decision", "proposed_copy", "evidence", "operator_question"},
                case_id,
            )
        )
        expected = reference["cases"][case_id]
        if claim.get("decision") != expected["decision"]:
            errors.append(f"{case_id}: decision disagrees with release evidence")
        if claim.get("proposed_copy") != expected["copy"]:
            errors.append(
                f"{case_id}: copy is unsupported or outside the approved catalog lines"
            )
        errors.extend(
            check_evidence(
                case_id, claim.get("evidence"), expected["requires"], sources
            )
        )
        if "operator_question" not in claim:
            errors.append(f"{case_id}: missing operator_question field")
        else:
            errors.extend(check_question(case_id, claim["operator_question"], expected))
    errors.extend(
        f"{missing}: missing decision"
        for missing in sorted(reference["cases"].keys() - seen)
    )
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path, help="path to review.json")
    parser.add_argument(
        "--packet",
        type=Path,
        help="local directory with acceptance.json and SOURCES.md",
    )
    args = parser.parse_args()
    try:
        report = read_json(args.report)
        reference = read_json((args.packet or EXAMPLE) / "acceptance.json")
        sources = read_sources((args.packet or EXAMPLE / "workspace") / "SOURCES.md")
        validate_packet(reference, sources)
        errors = check(report, reference, sources)
    except (OSError, ValueError) as exc:
        print(f"Cannot read review or fixture: {exc}", file=sys.stderr)
        return 2
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    count = len(reference["cases"])
    noun = "claim" if count == 1 else "claims"
    print(f"PASS: {count} {noun} checked against the local packet.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
