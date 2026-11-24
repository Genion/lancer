import type { OrchestrationV2ProjectedTurnItem } from "@lancer/contracts";
import type { CSSProperties } from "react";
interface TrajectoryNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly timestamp: string;
  readonly depth: number;
}

export type ProcessEventKind =
  | "activity"
  | "start"
  | "commit"
  | "handoff"
  | "checkpoint"
  | "test"
  | "review"
  | "fork"
  | "merge"
  | "artifact"
  | "tool"
  | "switch"
  | "compact"
  | "wait"
  | "xref"
  | "error"
  | "retry";
export interface ProcessActor {
  readonly id: string;
  readonly name: string;
  readonly short?: string;
  readonly badge?: string;
  readonly icon: string;
}
export interface ProcessIcon {
  readonly attributes: Readonly<Record<string, string>>;
  readonly parts: readonly {
    readonly tag: string;
    readonly attributes: Readonly<Record<string, string>>;
  }[];
}
export interface ProcessLane {
  readonly treeError?: string;
  readonly parentLaneId?: string;
  /** False for a configured task group without a real session yet. */
  readonly available?: boolean;
  readonly id: string;
  readonly name: string;
  readonly title?: string;
  readonly statusLabel?: string;
  readonly color: string;
  readonly relay: readonly string[];
}
export type GitTreeSource = Pick<
  OrchestrationV2ProjectedTurnItem,
  "sourceThreadId" | "sourceItemId"
> & {
  readonly entryId: string;
};
export interface ProcessEvent {
  readonly source?: GitTreeSource;
  readonly filePaths?: readonly string[];
  readonly modelFamily?: string;
  readonly id: string;
  readonly index: number;
  readonly time: number;
  readonly row?: number;
  readonly lane: string;
  readonly kind: ProcessEventKind;
  readonly actor: string;
  readonly label: string;
  readonly summary: string;
  readonly branch?: boolean;
  readonly branchId?: string;
  readonly emits?: boolean;
  readonly running?: boolean;
  readonly fail?: boolean;
  readonly targetActor?: string;
  readonly retryTarget?: string;
  readonly reference?: string;
  readonly waitDuration?: number;
  readonly hash?: string;
  readonly artifacts?: readonly unknown[];
  readonly unverified?: boolean;
  readonly artifactPath?: string;
  readonly sha256?: string;
  readonly statusCode?: string;
  readonly runId?: string;
  readonly errorCode?: string;
  readonly nativeNode?: TrajectoryNode;
  readonly evidenceTimestamp?: string;
  readonly evidenceModel?: string;
}
export interface ProcessFixture {
  readonly centeredTree?: boolean;
  readonly nativeLayout?: boolean;
  readonly laneSummary?: string;
  readonly minimumGraphHeight?: number;
  readonly timelineEnd?: number;
  readonly nodeLabels?: boolean;
  readonly clockLabel?: string;
  readonly statusLabel?: string;
  readonly recentActors?: readonly string[];
  readonly actors: readonly ProcessActor[];
  readonly icons: Readonly<Record<string, ProcessIcon>>;
  readonly lanes: readonly ProcessLane[];
  readonly events: readonly ProcessEvent[];
  /** Full conversation history when the tree is a condensed overview. */
  readonly conversationEvents?: readonly ProcessEvent[];
}
export interface ProcessViewState {
  readonly flightSeeds?: Readonly<Record<string, number>>;
  readonly time: number;
  /** Live-only event clocks. Empty means do not replay historical flights. */
  readonly flightSampledAt?: number;
  readonly flightTimes?: Readonly<Record<string, number>>;
  readonly lane: string;
  readonly focus: string | null;
  readonly highlighted: string | null;
  readonly hovered?: string | null;
  readonly traceSelection?: boolean;
  readonly open: ReadonlySet<string>;
  readonly reelPosition?: number;
  readonly currentActor?: string;
}
export interface ProcessSurfaceActions {
  readonly onToggle: (id: string) => void;
  readonly onToggleAll?: () => void;
  readonly onSelectLane: (lane: string) => void;
  readonly onSelectEvent: (id: string, hover?: boolean) => void;
  readonly onSelectSession: (id: string) => void;
  readonly onLaunch?: () => void;
  readonly onNewThread?: (zone?: string) => void;
  readonly onOpenTools?: () => void;
  readonly onToggleMaximize?: () => void;
  readonly onSelectModel?: (actor: string) => void;
}
export const laneStyle = (color: string): CSSProperties =>
  ({ "--lc": color, "--cc": color }) as CSSProperties;
