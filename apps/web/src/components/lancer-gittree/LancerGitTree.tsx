/* oxlint-disable shadcn/no-unknown-classes -- Retained Lancer graph uses its scoped gittree.css and semantic lane colors. */
import type { ScopedThreadRef } from "@lancer/contracts";
import { useState } from "react";
import {
  useQuietThreadProjection,
  useThreadShell,
  useThreadVisibleTurnItems,
  useThreadStatus,
} from "../../state/entities";
import { ProcessDataContext } from "./process-glyph";
import { ProcessLaneHeads, ProcessLegend, ProcessTree } from "./process-tree";
import { projectGitTree } from "./projection";
import type { GitTreeSource, ProcessSurfaceActions, ProcessViewState } from "./process-types";
import "./gittree.css";

export default function LancerGitTree({
  threadRef,
  workspaceRoot,
  repositoryRoot,
  onOpenFile,
  onShowSource,
}: {
  readonly threadRef: ScopedThreadRef;
  readonly workspaceRoot: string | undefined;
  readonly repositoryRoot?: string | undefined;
  readonly onOpenFile: (relativePath: string) => void;
  readonly onShowSource: (source: GitTreeSource) => boolean;
}) {
  const rows = useThreadVisibleTurnItems(threadRef);
  const shell = useThreadShell(threadRef);
  const connection = useThreadStatus(threadRef);
  const detail = useQuietThreadProjection(threadRef);
  const data = projectGitTree(
    rows,
    shell?.title ?? "Current thread",
    detail?.projection.nodes,
    shell?.runtime?.status === "idle" ? shell?.latestRun?.status : shell?.runtime?.status,
    { workspaceRoot, repositoryRoot },
  );
  const [lane, setLane] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [overview, setOverview] = useState(false);
  const state: ProcessViewState = {
    time: data.events.length + 1,
    lane,
    focus: lane === "all" ? null : lane,
    highlighted: selected,
    hovered,
    open: new Set(),
  };
  const actions: ProcessSurfaceActions = {
    onSelectLane: setLane,
    onSelectEvent: (id, hover) => {
      if (hover) {
        setHovered(id || null);
        return;
      }
      setSelected(id || null);
      const files = data.events.find((entry) => entry.id === id)?.filePaths;
      if (files?.length === 1) onOpenFile(files[0]!);
    },
    onToggle: setSelected,
    onSelectSession: setLane,
  };
  const event = data.events.find((entry) => entry.id === selected);
  const source = event?.source;
  const singleLane = data.lanes.length === 1 ? data.lanes[0] : undefined;
  return (
    <ProcessDataContext value={data}>
      <section className="lancer-gittree" aria-label="GitTree task trajectory">
        <div className="lancer-tree-toolbar flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">{singleLane?.name ?? "Task history"}</h2>
            {singleLane ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {data.events.length} {data.events.length === 1 ? "event" : "events"} ·{" "}
                {singleLane.statusLabel}
              </p>
            ) : null}
          </div>
          {data.lanes.length > 1 ? (
            <button type="button" onClick={() => setLane("all")}>
              All lanes
            </button>
          ) : null}
          <button type="button" aria-pressed={overview} onClick={() => setOverview(!overview)}>
            Overview
          </button>
        </div>
        {connection !== "live" ? (
          <p className="p-2 text-muted-foreground">
            {connection === "cached" ? "Offline cache" : "Syncing task history"}
          </p>
        ) : null}
        {data.events.length === 0 ? (
          <p className="p-4 text-muted-foreground">No events in this thread yet.</p>
        ) : null}
        <div className="process-tree-scroll">
          <div
            className="process-tree-columns"
            style={{ minWidth: Math.max(260, data.lanes.length * 140) }}
          >
            {!singleLane && data.lanes.length > 0 ? (
              <ProcessLaneHeads state={state} actions={actions} />
            ) : null}
            <ProcessTree state={state} actions={actions} overview={overview} />
          </div>
        </div>
        {event ? (
          <div className="lancer-tree-detail">
            <strong>{event.label}</strong>
            <p>{event.summary}</p>
            <p>{event.evidenceTimestamp}</p>
            {event.filePaths && event.filePaths.length > 0 ? (
              <ul className="lancer-tree-files" aria-label="Event files">
                {event.filePaths.map((path) => (
                  <li key={path}>
                    <button
                      type="button"
                      aria-label={`Open ${path}`}
                      onClick={() => onOpenFile(path)}
                    >
                      {path}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {source ? (
              <button
                type="button"
                onClick={() => setUnavailable(onShowSource(source) ? null : event.id)}
              >
                Show in timeline
              </button>
            ) : null}
            {unavailable === event.id ? (
              <p role="status">This source is unavailable in the current timeline.</p>
            ) : null}
          </div>
        ) : null}
        <ProcessLegend />
      </section>
    </ProcessDataContext>
  );
}
