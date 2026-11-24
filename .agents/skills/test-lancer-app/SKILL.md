---
name: test-lancer-app
description: Test Lancer's web and desktop UI through its built-in Browser panel against isolated development state. Use for browser verification, browser pairing recovery, and test fixtures. Use test-lancer-mobile for native mobile verification.
---

# Test Lancer web and desktop

Use Lancer’s built-in Browser panel for verification. Follow the recovery steps
below before declaring it unavailable. Do not install or switch to another
automation system. For native mobile testing, use
[test-lancer-mobile](../test-lancer-mobile/SKILL.md).

## Start the app

Reuse this task's healthy dev server. Otherwise run `vp run dev` from the
repository root and retain its terminal session. Use the checkout’s ignored
`.lancer-runtime` state and read the actual ports and pairing URL from the dev-runner output.
Leave `VITE_HTTP_URL` and `VITE_WS_URL` unset. Keep real sessions and store data out of test fixtures.

Use fictional project and thread data. Read
[references/sqlite-fixtures.md](references/sqlite-fixtures.md) only when
inspecting or seeding SQLite. Stop the test server before direct fixture writes.

## Drive agent turns for free

Do not spend a paid model to see a turn render. `vp run dev` registers the
`Replay (dev)` provider, which replays recorded turns with simulated streaming
through the real adapter and orchestration. Its models are scenarios:
`showcase` covers thinking, a plan, tool calls, an approval, and markdown.
Press `Ctrl+Alt+Shift+R` for a picker (GNOME takes that key for screen
recording), call `window.t3dev.replay("showcase")`
with `preview_evaluate`, or run
`node apps/server/src/bin.ts thread start --base-dir .lancer-runtime --provider devReplay --model showcase <project> "go"`.
When the test needs real provider behavior, use that provider's cheapest
model, such as Haiku for Claude or Luna for Codex.

## Use the Browser panel

Call `preview_status`. If no tab can be automated, call `preview_open`, including
when status reports `available: false` or `tabId: null`. Status can report
unavailable simply because no tab exists yet; opening a tab needs no user action.
Stop verification and explain the blocker only if the tools are absent or
`preview_open` reports unavailable or fails.

Navigate to the complete startup pairing URL once with
`preview_navigate`, then use `preview_snapshot` and Lancer’s interaction tools.
If the token was consumed or expired, run `node apps/server/src/bin.ts pair`
for a fresh one. Keep using the same tab.

## Verify and retain

Exercise the affected flow and capture the state that proves it works. Keep
the server, state, and panel available while the user inspects or iterates.
An assistant turn ending is not teardown. Stop only processes you started,
using retained terminal sessions or captured PIDs.

When sharing is requested, use an isolated workspace with fictional records and a host configured for sharing. Keep pairing tokens and other credentials out of screenshots and commits.
