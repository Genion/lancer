# Review the Ridge commuter bottle listing

You are the product claims reviewer for your fictional North Loop catalog. You are working alone on this local listing draft. Review this batch for the US English product page for the **Ridge 600, SKU NL-R600, revision B, standard carton**. Use only the supplied documents. The proposed listing is a draft. Every product, person-role, record and result in this exercise is fictional.

| Claim ID | Draft listing copy                          |
| -------- | ------------------------------------------- |
| C1       | Holds 600 mL.                               |
| C2       | Dishwasher safe, including the bottle body. |
| C3       | Includes two lids.                          |

Use current records that apply to this SKU, revision and carton. The packing guide and the fulfillment check are both release evidence. Neither supersedes the other. If two applicable records disagree, keep the disputed detail out of the release copy and leave a specific question for the local operator.

## Deliverable

Write exactly one JSON object to `review.json` in the workspace root. Use this shape for each of the three rows in the `claims` array:

```json
{
  "sku": "NL-R600",
  "revision": "B",
  "claims": [
    {
      "id": "<claim ID>",
      "decision": "<approve, revise, or hold>",
      "proposed_copy": "<one exact catalog line from the copy desk below>",
      "evidence": [
        { "source_id": "<ID from SOURCES.md>", "quote": "<verbatim evidence from that source>" }
      ],
      "operator_question": null
    }
  ]
}
```

For each row cite the shortest complete source sentence that directly supports your decision. Cite both sides of any unresolved conflict. Use `approve` for a supported draft, `revise` for a contradicted draft with a documented replacement, and `hold` for a claim blocked on conflicting evidence. For a hold, use an approved fallback line and replace `null` with a specific question for the person running this workspace. Name the product revision, both competing quantities and the local record or check needed to release the claim. Leave the question null for a closed decision.

The copy desk uses exact catalog strings. Select one line per claim, including the final punctuation. The list contains competing alternatives awaiting fact-check.

- Holds 600 mL.
- Holds 650 mL.
- Hand wash the bottle body.
- Dishwasher safe, including the bottle body.
- Includes two lids.
- Includes one lid.
- Ridge 600 commuter bottle.

Use the same filename on subsequent reviews. Do not publish the listing.
