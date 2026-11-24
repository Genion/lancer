/* oxlint-disable react/exhaustive-effect-dependencies -- Lane and overview changes are explicit triggers for imperative DOM scroll synchronization. */
/* oxlint-disable shadcn/no-unknown-classes -- Retained Lancer graph uses its scoped gittree.css and semantic lane colors. */
import { ChevronRightIcon } from "lucide-react";
import { fileBasename } from "@lancer/shared/path";
import { observeResize } from "../../lib/observeResize";
import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  actorName,
  clamp,
  clock,
  nativeClock,
  EVENT_NAMES,
  eventLanes,
  eventPoint,
  outEase,
  segment,
  springEase,
} from "./process-math";
import { ProcessActorIcon, ProcessGlyph, useProcessData } from "./process-glyph";
import type { ProcessEvent, ProcessSurfaceActions, ProcessViewState } from "./process-types";
import { laneStyle } from "./process-types";
import { cubicPath, processTreeRoutes } from "./process-curve-routes";
import { t } from "./labels";

export function ProcessLaneHeads({
  state,
  actions,
}: {
  readonly state: ProcessViewState;
  readonly actions: ProcessSurfaceActions;
}) {
  const data = useProcessData();
  const heads = useRef<HTMLDivElement>(null);
  // oxlint-disable-next-line lancer/no-unreasoned-state-sync -- Synchronize graph viewport dimensions and scroll position with the actual DOM.
  useLayoutEffect(() => {
    const current = heads.current?.querySelector<HTMLElement>('[data-current="true"]');
    const area = heads.current?.closest<HTMLElement>(".process-tree-scroll");
    if (!current || !area) return;
    const a = area.getBoundingClientRect(),
      b = current.getBoundingClientRect();
    if (b.left < a.left || b.right > a.right)
      area.scrollLeft += b.left - a.left - a.width / 2 + b.width / 2;
  }, [state.lane, data.lanes.map((lane) => lane.id).join("|")]);
  return (
    <div
      ref={heads}
      className="lh"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, data.lanes.length)}, minmax(0, 1fr))` }}
    >
      {data.lanes.map((lane) => {
        const events = data.events.filter((event) => event.lane === lane.id);
        const next = events.find((event) => event.time > state.time && event.kind !== "tool");
        const current =
          events.find((event) => event.running && event.time <= state.time) ??
          next ??
          events.at(-1);
        const waiting = events.some(
          (event) =>
            event.kind === "wait" &&
            event.time <= state.time &&
            state.time < event.time + (event.waitDuration ?? 0),
        );
        return (
          <button
            type="button"
            className={`lhc ${state.focus === lane.id ? "on" : ""}`}
            key={lane.id}
            disabled={lane.available === false}
            data-l={lane.id}
            data-tree-error={Boolean(lane.treeError)}
            data-current={state.lane === lane.id}
            style={{
              ...laneStyle(lane.color),
              opacity: state.focus && state.focus !== lane.id ? 0.45 : 1,
            }}
            onClick={() => actions.onSelectLane(lane.id)}
          >
            <span className="n">
              <i />
              {data.timelineEnd === undefined ? (
                <span className="lane-name">{`${lane.parentLaneId ? "↳ " : ""}${lane.name}`}</span>
              ) : (
                <span style={{ whiteSpace: "normal" }}>{lane.name}</span>
              )}
            </span>
            <span
              className="a"
              data-anchor-key={
                state.flightTimes && current ? `chip:${lane.id}:${current.actor}` : undefined
              }
            >
              {current ? (
                <>
                  <ProcessActorIcon actor={current.actor} />
                  {actorName(data, current.actor)}
                </>
              ) : (
                "Unknown"
              )}
            </span>
            <span
              className="p"
              style={{
                visibility:
                  current?.running || current?.unverified || lane.statusLabel === "Not started"
                    ? "hidden"
                    : undefined,
              }}
            >
              <i
                style={{
                  width: `${(events.filter((event) => event.time <= state.time).length / Math.max(1, events.length)) * 100}%`,
                }}
              />
            </span>
            <span className="s">
              {lane.treeError
                ? "History unavailable"
                : (lane.statusLabel ??
                  (!current
                    ? "Not started"
                    : current.unverified
                      ? "Unverified"
                      : current.running
                        ? t("lancer.process.running")
                        : waiting
                          ? t("lancer.process.waiting")
                          : next
                            ? `${events.filter((event) => event.time <= state.time).length}/${events.length} · ${EVENT_NAMES[next.kind]}`
                            : current?.fail
                              ? t("lancer.process.failed")
                              : t("lancer.process.done")))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
export function ProcessLegend() {
  const data = useProcessData();
  const kinds = [
    ...new Set(
      data.events.map((event) =>
        event.kind === "test" && event.fail ? ("test-fail" as const) : event.kind,
      ),
    ),
  ];
  if (!kinds.length) return null;
  return (
    <details className="lancer-tree-legend">
      <summary>Event legend</summary>
      <div className="lgd">
        {kinds.map((kind) => (
          <span key={kind} className="li" data-testid="process-legend-item">
            <span className="w">
              <span className="nd">
                <ProcessGlyph
                  event={{
                    kind: kind === "test-fail" ? "test" : kind,
                    actor: "",
                    fail: kind === "test-fail",
                  }}
                />
              </span>
            </span>
            {kind === "test-fail" ? "Test failed" : EVENT_NAMES[kind]}
          </span>
        ))}
      </div>
    </details>
  );
}
export function ProcessTree({
  state,
  actions,
  graphHeight,
  overview = false,
}: {
  readonly state: ProcessViewState;
  readonly actions: ProcessSurfaceActions;
  readonly graphHeight?: number;
  readonly overview?: boolean;
}) {
  const data = useProcessData();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 452, height: 552 });
  const [tip, setTip] = useState<{ event: ProcessEvent; x: number; y: number } | null>(null);
  // oxlint-disable-next-line lancer/no-unreasoned-state-sync -- Synchronize graph viewport dimensions and scroll position with the actual DOM.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      if (element.clientWidth > 0 && element.clientHeight > 0)
        setSize({ width: element.clientWidth, height: element.clientHeight });
    };
    measure();
    return observeResize(element, measure);
  }, []);
  const following = useRef(true);
  const previousLane = useRef(state.lane);
  const currentEvents = data.events.filter((event) => event.lane === state.lane);
  const lastCurrentId = currentEvents.at(-1)?.id;
  const lastCheckpointId = currentEvents.filter((event) => event.kind === "checkpoint").at(-1)?.id;
  const previousCheckpoint = useRef(lastCheckpointId);
  const arrivingId = currentEvents
    .filter((event) => {
      const time = state.flightTimes?.[event.id];
      return time !== undefined && time < event.time;
    })
    .at(-1)?.id;
  const previousArrival = useRef<string | undefined>(undefined);
  // oxlint-disable-next-line lancer/no-unreasoned-state-sync -- Synchronize graph viewport dimensions and scroll position with the actual DOM.
  useLayoutEffect(() => {
    const newArrival = arrivingId && arrivingId !== previousArrival.current;
    const newMessage = lastCheckpointId !== previousCheckpoint.current;
    if (previousLane.current !== state.lane || newArrival || newMessage) following.current = true;
    previousCheckpoint.current = lastCheckpointId;
    previousArrival.current = arrivingId;
    previousLane.current = state.lane;
    const element = ref.current;
    const targetId = arrivingId ?? lastCurrentId;
    if (!following.current || !element || element.clientHeight === 0 || !targetId) return;
    const node = element.querySelector<HTMLElement>(`[data-tree-anchor="${CSS.escape(targetId)}"]`);
    if (node) {
      element.scrollTop = Math.max(0, node.offsetTop - element.clientHeight + 120);
      const horizontal = element.closest<HTMLElement>(".process-tree-scroll");
      if (horizontal && (newArrival || newMessage)) {
        const bounds = horizontal.getBoundingClientRect();
        const target = node.getBoundingClientRect();
        if (target.left < bounds.left + 24 || target.right > bounds.right - 24)
          horizontal.scrollLeft += target.left - bounds.left - bounds.width / 2;
      }
    }
  }, [lastCurrentId, lastCheckpointId, arrivingId, state.lane, overview]);
  const maxRow = Math.max(1, ...data.events.map((e) => e.row ?? 0));
  const graphLanes = eventLanes(data);
  const singleLane = data.nativeLayout && graphLanes.length === 1;
  const rowHeight = singleLane ? (overview ? 32 : 58) : overview ? 18 : 32;
  const firstRowY = singleLane ? rowHeight / 2 + 8 : 16;
  const contentHeight = (singleLane ? 2 * firstRowY : 50) + maxRow * rowHeight;
  const height = overview
    ? Math.max(size.height, contentHeight)
    : (graphHeight ?? Math.max(size.height, data.minimumGraphHeight ?? 0, contentHeight));
  const point = (event: ProcessEvent) => {
    if (singleLane && event.row !== undefined)
      return { x: 24, y: firstRowY + event.row * rowHeight };
    const p = eventPoint(event, data, size.width, height);
    return overview && event.row !== undefined ? { ...p, y: firstRowY + event.row * rowHeight } : p;
  };
  const rails: React.ReactNode[] = [];
  for (const lane of graphLanes) {
    const events = data.events.filter((event) => event.lane === lane.id);
    const first = events[0];
    if (!first) {
      const index = graphLanes.findIndex((l) => l.id === lane.id);
      const x = ((index + 0.5) * size.width) / Math.max(1, graphLanes.length);
      rails.push(
        <path
          key={lane.id}
          data-empty-lane={lane.id}
          d={`M${x} 16V${Math.max(16, height - 30)}`}
          stroke={lane.color}
          strokeDasharray="2 5"
          opacity=".3"
        />,
      );
      continue;
    }
    if (data.nativeLayout) {
      const main = events.filter((e) => !e.branch && state.time >= e.time);
      const mainPath = main
        .map((e, i) => {
          const p = point(e);
          return `${i ? "L" : "M"}${p.x} ${p.y}`;
        })
        .join("");
      rails.push(
        <path
          key={lane.id}
          data-tree-rail={lane.id}
          d={mainPath}
          fill="none"
          stroke={lane.color}
          strokeWidth="1.6"
        />,
      );
      for (const event of events.filter((e) => e.branch && state.time >= e.time)) {
        const parent = events.find((e) => e.nativeNode?.id === event.nativeNode?.parentId);
        if (!parent) continue;
        const a = point(parent),
          b = point(event),
          mid = (a.y + b.y) / 2;
        rails.push(
          <path
            key={`${lane.id}:${event.id}:parent`}
            data-branch-rail={event.id}
            data-parent-event={parent.id}
            d={`M${a.x} ${a.y} C${a.x} ${mid},${b.x} ${mid},${b.x} ${b.y}`}
            fill="none"
            stroke={lane.color}
            strokeWidth="1.6"
          />,
        );
      }
      continue;
    }
    if (state.time < first.time) continue;
    const lastTime = Math.min(state.time, events.at(-1)!.time);
    const opacity = state.focus && state.focus !== lane.id ? 0.22 : 1;
    const path = (branch: boolean, start: number, end: number, branchId?: string) => {
      if (first.row !== undefined) {
        return events
          .filter((event) => event.time >= start && event.time <= end)
          .map((event, index) => {
            const p = point({ ...event, branch });
            return `${index ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          })
          .join("");
      }
      const points = [];
      if (!branchId) {
        for (let time = start; time <= end + 0.001; time += 0.12) {
          const p = point({ ...first, branch, time: Math.min(time, end) });
          points.push(`${points.length ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
        }
      } else {
        const samples = Math.max(2, Math.ceil((end - start) / 0.12));
        for (let sample = 0; sample <= samples; sample++) {
          const time = start + ((end - start) * sample) / samples;
          const p = point({ ...first, branch, branchId, time });
          points.push(`${points.length ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
        }
      }
      return points.join("");
    };
    rails.push(
      <path
        key={lane.id}
        data-tree-rail={lane.id}
        d={path(false, first.time, lastTime)}
        fill="none"
        stroke={lane.color}
        strokeWidth="1.6"
        opacity={opacity}
      />,
    );
    if (data.timelineEnd === undefined) {
      const fork = events.find((event) => event.kind === "fork" && !event.id.startsWith("branch:")),
        merge = events.find((event) => event.kind === "merge");
      if (fork && state.time > fork.time)
        rails.push(
          <path
            key={`${lane.id}-fork`}
            d={path(true, fork.time, Math.min(state.time, merge?.time ?? state.time))}
            fill="none"
            stroke={lane.color}
            strokeWidth="1.6"
            opacity={opacity}
          />,
        );
    } else
      for (const fork of events.filter(
        (event) => event.kind === "fork" && !event.id.startsWith("branch:"),
      )) {
        const branchEvents = events.filter((event) => event.branchId === fork.branchId);
        const merge = branchEvents.find((event) => event.kind === "merge");
        const terminal = fork.branchId
          ? branchEvents.find((event) => event.fail || event.unverified)
          : undefined;
        const last =
          merge?.time ??
          terminal?.time ??
          (fork.branchId ? branchEvents.at(-1)?.time : state.time) ??
          state.time;
        if (state.time > fork.time)
          rails.push(
            <path
              key={`${lane.id}-fork:${fork.id}`}
              data-branch-rail={fork.branchId ?? fork.id}
              d={path(true, fork.time, Math.min(state.time, last), fork.branchId)}
              fill="none"
              stroke={lane.color}
              strokeWidth="1.6"
              opacity={opacity}
            />,
          );
      }
    const next = events.find((event) => event.time > state.time && event.kind !== "tool");
    if (next) {
      const a = point({ ...first, time: lastTime, branch: next.branch ?? false }),
        b = point(next);
      rails.push(
        <path
          key={`${lane.id}-ghost`}
          d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
          stroke={lane.color}
          strokeDasharray="3 4"
          opacity={0.45 * opacity}
        />,
      );
    }
  }
  const timeY = point({
    id: "clock",
    index: -1,
    time: state.time,
    lane: data.lanes[0]?.id ?? "empty",
    kind: "start",
    actor: "you",
    label: "",
    summary: "",
  }).y;
  return (
    <>
      <div
        className="process-tree-viewport"
        ref={ref}
        data-testid="process-tree"
        onScroll={(event) => {
          const element = event.currentTarget;
          following.current = element.scrollHeight - element.clientHeight - element.scrollTop < 80;
        }}
        onMouseLeave={() => {
          setTip(null);
          actions.onSelectEvent("", true);
        }}
      >
        <div
          className="process-tree-space"
          style={{ height: height + (state.flightTimes ? 120 : 0) }}
        >
          <svg width={size.width} height={height} aria-hidden="true">
            {rails}
            {processTreeRoutes(data, state, point).map((route) => (
              <g key={route.id} opacity={route.opacity}>
                <path
                  data-curve-route="true"
                  data-curve-id={route.id}
                  data-curve-event={route.eventId}
                  data-source-key={route.source}
                  data-target-key={route.target}
                  data-curve-kind={route.kind}
                  d={cubicPath(route.points)}
                  fill="none"
                  stroke={route.color}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeDasharray={route.kind === "retry" ? "2 2" : "4 4"}
                />
              </g>
            ))}
            {!singleLane ? (
              <path
                d={`M0 ${timeY}H${size.width}`}
                stroke="var(--tx3)"
                strokeWidth=".5"
                strokeDasharray="1 3"
                opacity=".6"
              />
            ) : null}
          </svg>
          {data.events.map((event) => {
            const p = point(event),
              lane = data.lanes.find((lane) => lane.id === event.lane)!;
            const liveTime = state.flightTimes?.[event.id];
            const arriving = liveTime !== undefined && liveTime < event.time;
            const age = (liveTime ?? state.time) - event.time,
              visible = state.time >= event.time;
            const scale =
              liveTime !== undefined
                ? arriving
                  ? 0.65
                  : 1
                : event.kind === "tool"
                  ? outEase(segment(age, 0, 0.3))
                  : springEase(segment(age, 0, 0.55));
            const opacity =
              (state.focus && state.focus !== event.lane ? 0.22 : 1) *
              (visible && !arriving ? 1 : 0);
            const files = event.filePaths ?? [];
            const fileLabel =
              files.length === 1
                ? fileBasename(files[0]!)
                : files.length
                  ? `${files.length} files`
                  : null;
            const fileAction =
              files.length === 1
                ? `Open ${files[0]}`
                : fileLabel
                  ? `Choose from ${fileLabel}`
                  : null;
            const highlighted = state.highlighted === event.id || state.hovered === event.id;
            const waitConfirmed =
              !event.running && !event.fail && state.time >= event.time + (event.waitDuration ?? 0);
            const reveal = (element: HTMLElement) => {
              if (singleLane) {
                actions.onSelectEvent(event.id, true);
                return;
              }
              const rect = element.getBoundingClientRect();
              setTip({
                event,
                x: clamp(
                  (ref.current?.getBoundingClientRect().left ?? rect.left) - 252,
                  8,
                  innerWidth - 250,
                ),
                y: clamp(rect.top + rect.height / 2 - 30, 50, innerHeight - 120),
              });
              actions.onSelectEvent(event.id, true);
            };
            return (
              <Fragment key={event.id}>
                <button
                  type="button"
                  className={`nd ${singleLane ? "single-row" : ""} ${overview ? "compact-row" : ""} ${highlighted ? "hl" : ""} ${liveTime !== undefined && !arriving ? "process-node-landed" : ""}`}
                  data-tree-anchor={event.id}
                  data-delivery-state={arriving ? "arriving" : "saved"}
                  data-anchor-key={visible && !singleLane ? `tree:${event.id}` : undefined}
                  data-event-id={event.id}
                  data-event-lane={event.lane}
                  data-event-type={event.kind}
                  data-unverified={event.unverified || undefined}
                  data-testid={event.kind === "tool" ? "process-tool-node" : "process-event-node"}
                  aria-label={`${EVENT_NAMES[event.kind]} · ${event.label}${fileAction ? ` · ${fileAction}` : ""}`}
                  style={{
                    ...laneStyle(lane.color),
                    left: singleLane ? 8 : p.x,
                    right: singleLane ? 8 : undefined,
                    top: p.y,
                    height: singleLane ? rowHeight - 4 : undefined,
                    opacity,
                    transform: singleLane
                      ? "translateY(-50%)"
                      : `translate(-50%,-50%) scale(${scale})`,
                    pointerEvents: visible ? "auto" : "none",
                  }}
                  onMouseEnter={(e) => reveal(e.currentTarget)}
                  onFocus={(e) => reveal(e.currentTarget)}
                  onBlur={() => {
                    setTip(null);
                    actions.onSelectEvent("", true);
                  }}
                  onMouseLeave={() => {
                    setTip(null);
                    actions.onSelectEvent("", true);
                  }}
                  tabIndex={visible ? 0 : -1}
                  aria-describedby={tip?.event.id === event.id ? "process-tree-tooltip" : undefined}
                  onClick={() => actions.onSelectEvent(event.id)}
                >
                  {singleLane ? (
                    <>
                      <span
                        className="row-marker"
                        data-anchor-key={visible ? `tree:${event.id}` : undefined}
                      >
                        <ProcessGlyph event={event} confirmed={waitConfirmed} />
                      </span>
                      <span className="row-copy">
                        <span className="row-title">{event.label}</span>
                        {fileLabel ? (
                          <span className="row-file">
                            {files.length === 1 ? files[0] : fileLabel}
                          </span>
                        ) : null}
                      </span>
                      {fileAction ? (
                        <ChevronRightIcon className="row-arrow" aria-hidden="true" />
                      ) : null}
                    </>
                  ) : (
                    <ProcessGlyph event={event} confirmed={waitConfirmed} />
                  )}
                  {!singleLane && fileLabel && !overview ? (
                    <span
                      className="node-file"
                      aria-hidden="true"
                      style={{ maxWidth: Math.max(40, size.width / graphLanes.length / 2 - 18) }}
                    >
                      {fileLabel}
                    </span>
                  ) : null}
                </button>
              </Fragment>
            );
          })}
          {data.lanes.map((lane, index) => {
            const next = data.events.find(
              (event) => event.lane === lane.id && event.time > state.time && event.kind !== "tool",
            );
            if (!next) return null;
            const p = point(next),
              pulse = 0.5 + 0.5 * Math.sin(state.time * 4.2 + index),
              dim = state.focus && state.focus !== lane.id ? 0.22 : 1;
            return (
              <Fragment key={`${lane.id}-ghost`}>
                <span
                  className="nd"
                  data-anchor-key={`tree:${next.id}`}
                  data-ghost-for={next.id}
                  aria-label={`${EVENT_NAMES[next.kind]} · ${next.label}`}
                  style={{
                    ...laneStyle(lane.color),
                    left: p.x,
                    top: p.y,
                    opacity: dim * (0.55 + 0.35 * pulse),
                    transform: `translate(-50%,-50%) scale(${1 + pulse * 0.12})`,
                  }}
                >
                  <span className="gg" />
                </span>
              </Fragment>
            );
          })}
        </div>
      </div>
      {tip ? (
        <aside
          className="process-event-tip"
          id="process-tree-tooltip"
          role="tooltip"
          style={
            {
              display: "block",
              left: tip.x,
              top: tip.y,
              "--lc": data.lanes.find((lane) => lane.id === tip.event.lane)?.color,
            } as CSSProperties
          }
        >
          <div className="t">
            <ProcessGlyph event={tip.event} confirmed />
            {EVENT_NAMES[tip.event.kind] === tip.event.label
              ? tip.event.label
              : `${EVENT_NAMES[tip.event.kind]} · ${tip.event.label}`}
          </div>
          <div className="k">
            {data.lanes.find((lane) => lane.id === tip.event.lane)?.name} ·{" "}
            {tip.event.evidenceModel ?? actorName(data, tip.event.actor)} ·{" "}
            {tip.event.evidenceTimestamp ??
              (tip.event.nativeNode
                ? nativeClock(tip.event.nativeNode.timestamp)
                : clock(tip.event.time))}{" "}
            · {tip.event.hash ?? tip.event.id.slice(-7)}
          </div>
          <p>{tip.event.summary}</p>
        </aside>
      ) : null}
    </>
  );
}
