# Lancer Harness

Lancer is a local runtime for business agents and an early AGI research prototype. Our goal is an AI employee that can take responsibility for a job. Today, an operator gives one agent a workspace and an assignment. The agent works from those records, delivers a file, and flags decisions that need human judgment.

## GitTree and Files

**GitTree** shows how a task unfolded. Select an event with a recorded workspace file to open that file in **Files**. If an event refers to several files, choose the one you want. **Show in timeline** takes you back to the original conversation entry.

**Files** opens the workspace explorer and file previews. After inspecting the result, choose **GitTree** to return to the selected event.

## Try a business task

[Review a product listing](examples/product-claims-review/README.md) using a fictional draft, product specifications, care instructions, and packing records. Lancer displays the agent's proposed copy, supporting quotations, and any question the records leave open. The exercise includes a separate offline checker and a [report from a completed run](examples/product-claims-review/sample-review.json).

## Run locally

### Install `vp`

Install [Vite+](https://viteplus.dev/guide/). From the repository root, run:

```sh
vp i
vp run dev
```

Open the local pairing URL printed by the launcher. For the Electron app, use `vp run dev:desktop`. The launchers keep development state in `.lancer-runtime` within this checkout. Configure your preferred model provider before starting a task. A hosted provider can receive workspace text that the agent reads.

See the [development guide](docs/operations/development.md) and the [task history guide](docs/user/activity-log.md).

## Lancer series

This checkout develops **Lancer Harness**, the local business runtime in the [Lancer series](https://github.com/raylee-ai/lancer). The website builder is a separate direction within the series.

## Public test fixtures

The public source snapshot omits provider replay payloads, compressed evaluation templates, and a desktop smoke-test database. Running the app and the fictional product review example requires none of these files. To run the corresponding test suites, use Python 3.9 or later:

```sh
python3 scripts/restore-public-fixtures.py
```

The script downloads fixtures from a pinned public T3 Code commit and verifies their Git blob hashes before and after applying the Lancer name changes. It also supports an offline checkout through `--upstream /path/to/checkout`.

## Upstream

Lancer builds on [T3 Code](https://github.com/pingdotgg/t3code). The source commands above run Lancer Harness. The upstream project distributes its own packages and hosted services. See the [license](LICENSE).
