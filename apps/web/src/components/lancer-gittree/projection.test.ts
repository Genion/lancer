import {
  CheckpointId,
  CheckpointScopeId,
  MessageId,
  NodeId,
  ThreadId,
  TurnItemId,
  type OrchestrationV2ProjectedTurnItem,
  type OrchestrationV2TurnItem,
  type OrchestrationV2TurnItemStatus,
} from "@lancer/contracts";
import * as DateTime from "effect/DateTime";
import { describe, expect, it } from "vite-plus/test";
import { projectGitTree } from "./projection";

function row(
  id: string,
  status: OrchestrationV2TurnItemStatus = "running",
  node: string | null = null,
) {
  const now = DateTime.makeUnsafe("2026-11-15T00:00:00Z");
  return {
    position: 0,
    visibility: "local",
    sourceThreadId: ThreadId.make("thread"),
    sourceItemId: TurnItemId.make(id),
    item: {
      type: "dynamic_tool",
      toolName: "read_file",
      input: {},
      id: TurnItemId.make(id),
      threadId: ThreadId.make("thread"),
      runId: null,
      nodeId: node ? NodeId.make(node) : null,
      providerThreadId: null,
      providerTurnId: null,
      nativeItemRef: null,
      parentItemId: null,
      ordinal: 0,
      status,
      title: "Read file",
      startedAt: now,
      completedAt: null,
      updatedAt: now,
    },
  } satisfies OrchestrationV2ProjectedTurnItem;
}
describe("T3 event projection for Lancer GitTree", () => {
  it("replaces replayed source events with their latest state without duplicating nodes", () => {
    const data = projectGitTree([row("a"), row("a", "completed")], "Task");
    expect(data.events).toHaveLength(1);
    expect(data.events[0]).toMatchObject({
      id: "thread:a",
      running: false,
      statusCode: "completed",
    });
    expect(data.events[0]?.summary).toContain("Unknown");
  });
  it("distinguishes failure, cancellation and interruption", () => {
    for (const status of ["failed", "cancelled", "interrupted"] as const) {
      const data = projectGitTree([row("a", status)], "Task");
      expect(data.events[0]).toMatchObject({
        statusCode: status,
        fail: status === "failed",
        unverified: status !== "failed",
      });
      expect(data.lanes[0]?.statusLabel).not.toBe("Completed");
    }
  });
  it("distinguishes a missing tool receipt from an ordinary interruption", () => {
    const stopped = row("stopped", "interrupted");
    const recovered = {
      ...stopped,
      item: { ...stopped.item, toolOutcome: "unknown_after_restart" as const },
    };
    expect(projectGitTree([recovered], "Task").events[0]?.summary).toContain("Verify the result");
    expect(projectGitTree([stopped], "Task").events[0]?.summary).not.toContain("Verify the result");
  });
  it("preserves agent identities and colors when earlier history is loaded", () => {
    const nodes = ["agent-a", "agent-b"].map((id) => ({
      id: NodeId.make(id),
      parentNodeId: null,
      kind: "subagent" as const,
    }));
    const original = projectGitTree([row("b", "running", "agent-b")], "Task", nodes);
    const restored = projectGitTree(
      [row("a", "completed", "agent-a"), row("b", "running", "agent-b")],
      "Task",
      nodes,
    );
    expect(restored.lanes.find((lane) => lane.id === original.lanes[0]?.id)).toEqual(
      original.lanes[0],
    );
  });
  it("does not invent a parent edge when the parent is missing", () => {
    const child = row("child");
    const withParent = {
      ...child,
      item: { ...child.item, parentItemId: TurnItemId.make("parent") },
    };
    expect(projectGitTree([withParent], "Task").events[0]?.reference).toBeUndefined();
    expect(projectGitTree([row("parent"), withParent], "Task").events[1]?.reference).toBe(
      "thread:parent",
    );
  });
  it("uses only a valid start and end pair for duration", () => {
    const item = row("a", "completed");
    const finished = {
      ...item,
      item: { ...item.item, completedAt: DateTime.makeUnsafe("2026-11-15T00:00:03Z") },
    };
    expect(projectGitTree([finished], "Task").events[0]?.summary).toContain("3.0 s");
  });
});

it("keeps ordinary tool execution nodes in the main lane", () => {
  const nodes = ["tool-a", "tool-b"].map((id) => ({
    id: NodeId.make(id),
    parentNodeId: null,
    kind: "tool_call" as const,
  }));
  const data = projectGitTree(
    [row("a", "completed", "tool-a"), row("b", "running", "tool-b")],
    "Task",
    nodes,
  );
  expect(data.lanes).toHaveLength(1);
});

describe("workspace files in GitTree", () => {
  const base = row("record", "completed");
  function paths(
    item: OrchestrationV2TurnItem,
    visibility: OrchestrationV2ProjectedTurnItem["visibility"] = base.visibility,
  ) {
    return projectGitTree([{ ...base, item, visibility }], "Catalog", [], "completed", {
      workspaceRoot: "/repo/catalog",
      repositoryRoot: "/repo",
    }).events[0]?.filePaths;
  }

  it("opens current paths of a multi-file edit, excluding deleted, renamed-away and outside files", () => {
    expect(
      paths({
        ...base.item,
        type: "file_change",
        fileName: "before.json",
        changes: [
          { operation: "update", path: "/repo/catalog/review.json", oldPath: "before.json" },
          { operation: "delete", path: "retired.json" },
          { operation: "add", path: "./notes.md" },
          { operation: "update", path: "../another-project/source.md" },
        ],
      }),
    ).toEqual(["review.json", "notes.md"]);
    expect(paths({ ...base.item, type: "file_change", fileName: "review.json" })).toEqual([
      "review.json",
    ]);
  });

  it("opens named tool inputs and outputs, deduplicates paths and omits unrelated values", () => {
    expect(
      paths({
        ...base.item,
        type: "dynamic_tool",
        toolName: "review_claims",
        input: { file_path: "/repo/catalog/SOURCES.md", prompt: "Also read ignored.txt" },
        output: { output_path: "handoff/review.json", path: "./SOURCES.md" },
      }),
    ).toEqual(["SOURCES.md", "handoff/review.json"]);
    expect(
      paths({
        ...base.item,
        type: "command_execution",
        input: "cat review.json",
        output: "review.json",
      }),
    ).toEqual([]);
  });

  it("opens actual Markdown links, including references, but leaves code examples and external URLs in the timeline", () => {
    expect(
      paths({
        ...base.item,
        type: "assistant_message",
        messageId: MessageId.make("answer"),
        streaming: false,
        text: [
          "Read [the review](<handoff/output review.json>) and [the source][packet].",
          "[packet]: /repo/catalog/SOURCES.md#L3",
          "Example: `[example](never.md)`",
          "[outside](file:///private/data.md) [online](https://example.com/file.json)",
        ].join("\n\n"),
      }),
    ).toEqual(["handoff/output review.json", "SOURCES.md"]);
  });

  it("resolves repository-relative checkpoint names and leaves inherited paths to their source thread", () => {
    expect(
      paths({
        ...base.item,
        type: "checkpoint",
        checkpointId: CheckpointId.make("checkpoint"),
        scopeId: CheckpointScopeId.make("scope"),
        files: [
          { path: "catalog/review.json", kind: "modified", additions: 1, deletions: 0 },
          { path: "other/review.json", kind: "modified", additions: 1, deletions: 0 },
        ],
      }),
    ).toEqual(["review.json"]);
    expect(
      paths({ ...base.item, type: "file_change", fileName: "review.json" }, "inherited"),
    ).toEqual([]);
  });
});
