import {
  threadRuntimeCanArchive,
  type ThreadRuntimeSummary,
} from "@lancer/client-runtime/state/models";

export function threadCanArchive(runtime: ThreadRuntimeSummary | null | undefined): boolean {
  return threadRuntimeCanArchive(runtime);
}
