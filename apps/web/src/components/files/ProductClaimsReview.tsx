import { resolvePathLinkTarget } from "@lancer/shared/fileLinks";
import { workspaceRelativeFilePath } from "@lancer/shared/path";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { Badge } from "~/components/ui/badge";

const NonBlank = Schema.String.check(Schema.isPattern(/\S/));
const Claim = Schema.Struct({
  id: NonBlank,
  decision: Schema.Literals(["approve", "revise", "hold"]),
  proposed_copy: NonBlank,
  evidence: Schema.NonEmptyArray(Schema.Struct({ source_id: NonBlank, quote: NonBlank })),
  operator_question: Schema.NullOr(NonBlank),
});
const Report = Schema.Struct({
  sku: NonBlank,
  revision: NonBlank,
  claims: Schema.NonEmptyArray(Claim),
});
const decodeReport = Schema.decodeUnknownOption(Schema.fromJsonString(Report), {
  onExcessProperty: "error",
});

export function readProductClaimsReview(
  path: string | null,
  cwd: string,
  file: { readonly contents: string; readonly truncated: boolean } | null,
): typeof Report.Type | null {
  if (!path || !/(?:^|[/\\])review\.json$/.test(path) || !file || file.truncated) return null;
  if (workspaceRelativeFilePath(resolvePathLinkTarget(path, cwd), cwd) === null) return null;
  const report = Option.getOrNull(decodeReport(file.contents));
  if (!report) return null;
  const claimIds = new Set<string>();
  for (const claim of report.claims) {
    if (claimIds.has(claim.id)) return null;
    claimIds.add(claim.id);
    if (
      claim.decision === "hold"
        ? !claim.operator_question?.includes("?")
        : claim.operator_question !== null
    ) {
      return null;
    }
  }
  return report;
}

const decisions = {
  approve: { label: "Approved", variant: "success" },
  revise: { label: "Revised", variant: "info" },
  hold: { label: "On hold", variant: "warning" },
} as const;

export function ProductClaimsReview({ review }: { review: typeof Report.Type }) {
  return (
    <section
      aria-label="Product claims review"
      className="min-h-0 flex-1 overflow-auto px-4 py-4 text-foreground"
    >
      <header className="mb-3">
        <h2 className="text-base font-semibold">Product claims review</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          SKU <span className="font-mono">{review.sku}</span> · Revision {review.revision}
        </p>
      </header>
      <div className="divide-y border-y">
        {review.claims.map((claim) => (
          <article
            key={claim.id}
            aria-label={`Claim ${claim.id}`}
            className="space-y-2 py-3 wrap-anywhere"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold">Claim {claim.id}</h3>
              <Badge variant={decisions[claim.decision].variant}>
                {decisions[claim.decision].label}
              </Badge>
            </div>
            <div>
              <h4 className="text-2xs text-muted-foreground">
                {claim.decision === "hold" ? "Fallback copy" : "Proposed copy"}
              </h4>
              <p className="text-sm font-medium whitespace-pre-wrap">{claim.proposed_copy}</p>
            </div>
            <div>
              <h4 className="text-2xs text-muted-foreground">Cited evidence</h4>
              <ul className="mt-1 space-y-1">
                {claim.evidence.map((entry, index) => (
                  // oxlint-disable-next-line react/no-array-index-key -- read-only source rows may repeat an identical citation and have no individual IDs.
                  <li key={index} className="border-l-2 border-border pl-2 text-xs leading-relaxed">
                    <code className="mr-2 text-2xs text-muted-foreground">{entry.source_id}</code>
                    <span className="whitespace-pre-wrap">{entry.quote}</span>
                  </li>
                ))}
              </ul>
            </div>
            {claim.operator_question && (
              <div className="rounded-md border border-warning/25 bg-warning-surface px-2.5 py-2">
                <h4 className="text-2xs font-medium text-warning-foreground">Operator question</h4>
                <p className="mt-0.5 text-xs leading-relaxed whitespace-pre-wrap">
                  {claim.operator_question}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
