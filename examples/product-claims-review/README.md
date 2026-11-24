# Review product claims before publishing a listing

In this local Lancer Harness exercise, one agent reviews three lines of product copy for a fictional commuter bottle. The operator receives replacement copy, quotations from the applicable records, and one question about an unresolved carton discrepancy.

## Run it

1. Copy the `workspace` directory to a local working folder. It contains the assignment and synthetic release packet. Keep the acceptance fixture and verifier outside the agent's working folder for a blind run.
2. In Lancer Harness, open that folder as a project, start a thread, and select your configured provider. Submit this request:

   > Act as my product claims reviewer for this local listing. Read BRIEF.md and SOURCES.md in this workspace. Review all three proposed claims and write review.json in the exact requested format. Leave any unresolved question for me in the report. Work only in this folder and finish after checking the file.

3. In GitTree, select the event labeled `review.json` to open the report in Files. You can also open it from the Files explorer. The review shows each decision beside its proposed copy and supporting quotations. The held claim includes fallback copy and a question for the operator. Check the quotations against `SOURCES.md` before using the copy. **Show JSON source** opens the underlying report.
4. From this example directory, check the generated file with Python 3:

   ```sh
   python3 verify.py /path/to/your/working-folder/review.json
   ```

The verifier runs offline. It checks the SKU, revision, all three decisions, the exact catalog copy, verbatim quotations from the relevant records, both sides of the discrepancy, and the content of the follow-up question. It exits with 0 on acceptance, 1 for a rejected report, and 2 for an unreadable or invalid input. Run it again against the same file for the same result. After a rejection, the operator can ask the agent to correct the same report and rerun the check.

The workspace and report are local files. When using a hosted model, the provider can receive record text that the agent reads during its turn. Use the supplied fictional packet to try the exercise. The workflow ends with a local report.

[Read a verified sample review](sample-review.json) produced in an isolated Lancer Harness session using Codex. The session received only the brief and release packet. To check that example locally:

```sh
python3 verify.py sample-review.json
```

## Use a different local SKU

1. Replace the draft claims, copy choices, SKU and revision in your working folder’s `BRIEF.md`. Update `SOURCES.md`; start each record with a level-three heading such as `### QC-12 · Inspection note` and place its text below. Give the agent only those input files.
2. In a separate local packet directory, put a copy of the same `SOURCES.md` and your own `acceptance.json`. Start from [the example acceptance file](acceptance.json). Set the SKU and revision, then replace the case IDs. For each case specify its correct decision, exact permitted copy and required source IDs. Each source maps to a list of acceptable quotations; the report must cite at least one from each required source. For a hold, set `question_requirements`: each label maps to literal alternatives, at least one of which must appear in the operator’s question. Matching ignores case and respects word boundaries.
3. Check the local deliverable with the packet you prepared:

   ```sh
   python3 verify.py /path/to/working-folder/review.json --packet /path/to/local-packet
   ```

The operator supplies the reference decisions and quotations. The checker measures the report against those decisions. Keep the packet, generated report and any real records in your local working directories.
