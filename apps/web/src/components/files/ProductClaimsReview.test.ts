import { describe, expect, it } from "vite-plus/test";
import fixture from "../../../../../examples/product-claims-review/sample-review.json?raw";
import { readProductClaimsReview } from "./ProductClaimsReview";

const cwd = "/workspace";
const file = { contents: fixture, truncated: false };

describe("product claims review preview", () => {
  it.each(["review.json", "output/review.json", "/workspace/output/review.json"])(
    "opens the supplied review at %s and retains both quotes for the held claim",
    (path) => {
      const report = readProductClaimsReview(path, cwd, file);
      expect(report).toEqual(JSON.parse(fixture));
      expect(report?.claims.map((claim) => claim.decision)).toEqual(["approve", "revise", "hold"]);
      expect(report?.claims[2]?.evidence.map((item) => item.source_id)).toEqual([
        "PACK-31",
        "QA-08",
      ]);
    },
  );

  it("preserves the exact proposed copy and quotation including surrounding whitespace", () => {
    const contents = fixture
      .replace('"Holds 600 mL."', '"  Holds 600 mL.  "')
      .replace(
        '"The approved fill capacity is 600 mL."',
        '" The approved fill capacity is 600 mL. "',
      );
    const report = readProductClaimsReview("review.json", cwd, { ...file, contents });
    expect(report?.claims[0].proposed_copy).toBe("  Holds 600 mL.  ");
    expect(report?.claims[0].evidence[0].quote).toBe(" The approved fill capacity is 600 mL. ");
  });

  it.each([
    "sample-review.json",
    "/another-project/review.json",
    "../elsewhere/review.json",
    "/workspace/../elsewhere/review.json",
    null,
  ])("keeps the normal file surface for %s", (path) => {
    expect(readProductClaimsReview(path, cwd, file)).toBeNull();
  });

  it("keeps the normal file surface for pending and truncated reads", () => {
    expect(readProductClaimsReview("review.json", cwd, null)).toBeNull();
    expect(readProductClaimsReview("review.json", cwd, { ...file, truncated: true })).toBeNull();
  });

  it.each([
    ["invalid JSON", "{"],
    ["unrelated JSON", '{"reviews":[]}'],
    ["empty claims", '{"sku":"SKU","revision":"B","claims":[]}'],
    ["unrecognized fields", fixture.replace('"sku":', '"unrecognized": true, "sku":')],
    ["unknown decision", fixture.replace('"approve"', '"release"')],
    ["missing source ID", fixture.replace('"ENG-17"', '"  "')],
    ["missing quotation", fixture.replace('"quote":', '"missing":')],
    [
      "missing decision question field",
      fixture.replace('"operator_question": null', '"other": null'),
    ],
    [
      "open question on a closed decision",
      fixture.replace('"operator_question": null', '"operator_question": "Check?"'),
    ],
    ["missing question on hold", fixture.replace(/"For Ridge 600[^"]+\?"/, "null")],
    ["duplicate claim ID", fixture.replace('"C2"', '"C1"')],
  ])("keeps the normal file surface for %s", (_label, contents) => {
    expect(readProductClaimsReview("review.json", cwd, { ...file, contents })).toBeNull();
  });
});
