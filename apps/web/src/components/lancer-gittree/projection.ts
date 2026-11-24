import type {
  OrchestrationV2ExecutionNode,
  OrchestrationV2ProjectedTurnItem,
} from "@lancer/contracts";
import * as DateTime from "effect/DateTime";
import { workspaceFilesForItem, type GitTreeWorkspace } from "./workspaceFiles";
import type { ProcessEventKind, ProcessFixture } from "./process-types";

const colors = ["#8b5cf6", "#10b981", "#ec4899", "#3b82f6", "#f59e0b"];
const statusLabels: Readonly<Record<string, string>> = {
  idle: "Not started",
  queued: "Queued",
  preparing: "Preparing",
  starting: "Starting",
  pending: "Pending",
  running: "Running",
  waiting: "Waiting",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  interrupted: "Interrupted",
};
const kinds: Readonly<Record<string, ProcessEventKind>> = {
  user_message: "start",
  assistant_message: "artifact",
  reasoning: "activity",
  proposed_plan: "artifact",
  file_change: "artifact",
  command_execution: "tool",
  dynamic_tool: "tool",
  file_search: "tool",
  web_search: "tool",
  checkpoint: "checkpoint",
  error: "error",
  compaction: "compact",
  handoff: "handoff",
  fork: "fork",
  thread_created: "fork",
  subagent: "fork",
  approval_request: "wait",
  user_input_request: "wait",
  secret_request: "wait",
};
function laneColor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length]!;
}
const itemKey = (threadId: string, itemId: string) => `${threadId}:${itemId}`;

/** Pure projection: stable source IDs replace rows on recovery, never append a replay. */
export function projectGitTree(
  rows: readonly OrchestrationV2ProjectedTurnItem[],
  title: string,
  nodes: readonly (Pick<OrchestrationV2ExecutionNode, "id" | "parentNodeId" | "kind"> &
    Partial<Pick<OrchestrationV2ExecutionNode, "status">>)[] = [],
  mainStatus?: string,
  workspace?: GitTreeWorkspace,
): ProcessFixture {
  const unique = new Map<string, OrchestrationV2ProjectedTurnItem>();
  for (const row of rows) unique.set(itemKey(row.sourceThreadId, row.sourceItemId), row);
  const ordered = [...unique.values()].sort((a, b) => a.position - b.position);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const laneOf = (row: OrchestrationV2ProjectedTurnItem) => {
    let id = row.item.nodeId;
    const visited = new Set<string>();
    while (id && !visited.has(id)) {
      visited.add(id);
      const node = nodeMap.get(id);
      if (!node) break;
      if (node.kind === "subagent") return `${row.sourceThreadId}:${node.id}`;
      id = node.parentNodeId;
    }
    return `${row.sourceThreadId}:main`;
  };
  const laneIds = [...new Set(ordered.map(laneOf))];
  const events = ordered.map((row, index) => {
    const item = row.item;
    const duration =
      item.startedAt && item.completedAt
        ? DateTime.toEpochMillis(item.completedAt) - DateTime.toEpochMillis(item.startedAt)
        : null;
    const status = statusLabels[item.status] ?? item.status;
    const fallback = ((item.type === "dynamic_tool" && item.toolName) || item.type).replaceAll(
      "_",
      " ",
    );
    const label = item.title?.trim() || fallback.charAt(0).toUpperCase() + fallback.slice(1);
    const parentKey = item.parentItemId ? itemKey(row.sourceThreadId, item.parentItemId) : null;
    return {
      id: itemKey(row.sourceThreadId, row.sourceItemId),
      filePaths:
        workspace && row.visibility === "local" ? workspaceFilesForItem(item, workspace) : [],
      source: {
        sourceThreadId: row.sourceThreadId,
        sourceItemId: row.sourceItemId,
        entryId:
          item.type === "assistant_message" || item.type === "user_message"
            ? item.messageId
            : item.id,
      },
      index,
      row: index,
      time: index,
      lane: laneOf(row),
      actor: laneOf(row),
      kind: kinds[item.type] ?? "activity",
      label,
      summary:
        item.toolOutcome === "unknown_after_restart"
          ? "Outcome unknown after restart. Verify the result before retrying."
          : `${status} · ${duration !== null && duration >= 0 ? `${(duration / 1000).toFixed(1)} s` : "Unknown duration"}`,
      running: item.status === "running",
      fail: item.status === "failed",
      unverified: item.status === "cancelled" || item.status === "interrupted",
      statusCode: item.status,
      ...(parentKey && unique.has(parentKey) ? { reference: parentKey } : {}),
      evidenceTimestamp: item.startedAt ? DateTime.formatIso(item.startedAt) : "Time unavailable",
      nativeNode: {
        id: itemKey(row.sourceThreadId, row.sourceItemId),
        parentId: parentKey && unique.has(parentKey) ? parentKey : null,
        depth: 0,
        timestamp: item.startedAt ? DateTime.formatIso(item.startedAt) : "",
      },
    };
  });
  return {
    nativeLayout: true,
    centeredTree: true,
    nodeLabels: false,
    timelineEnd: Math.max(1, events.length),
    actors: laneIds.map((id) => ({
      id,
      name: id.endsWith(":main") ? title : `Agent ${id.split(":").at(-1)}`,
      icon: "agent",
    })),
    icons: {},
    lanes: laneIds.map((id) => ({
      id,
      name: id.endsWith(":main") ? title : `Agent ${id.split(":").at(-1)}`,
      color: laneColor(id),
      relay: [id],
      statusLabel:
        statusLabels[
          (id.endsWith(":main")
            ? mainStatus
            : nodes.find((node) => id.endsWith(`:${node.id}`))?.status) ??
            events
              .filter(
                (event) => event.lane === id && (event.running || event.statusCode === "waiting"),
              )
              .at(-1)?.statusCode ??
            events.filter((event) => event.lane === id).at(-1)?.statusCode ??
            "idle"
        ] ?? "Unknown",
    })),
    events,
  };
}
