import {
  LANCER_PROJECT_FILE_NAME,
  type EnvironmentId,
  type LancerProjectFile,
  type LancerProjectFileScript,
} from "@lancer/contracts";
import { parseLancerProjectFile } from "@lancer/shared/lancerProjectFile";

import { useProjectFileQuery } from "~/components/files/projectFilesQueryState";

const NO_SCRIPTS: ReadonlyArray<LancerProjectFileScript> = [];

export interface LancerProjectFileState {
  status: "loading" | "missing" | "invalid" | "valid";
  file: LancerProjectFile | null;
  scripts: ReadonlyArray<LancerProjectFileScript>;
}

export function useLancerProjectFileState(
  environmentId: EnvironmentId,
  cwd: string | null,
): LancerProjectFileState {
  const query = useProjectFileQuery(
    environmentId,
    cwd ?? "",
    LANCER_PROJECT_FILE_NAME,
    cwd !== null,
    true,
  );
  const contents = query.data && !query.data.truncated ? query.data.contents : null;
  const isPending = query.isPending;
  if (contents === null) {
    return {
      status: isPending ? "loading" : "missing",
      file: null,
      scripts: NO_SCRIPTS,
    } as const;
  }
  const file = parseLancerProjectFile(contents);
  if (file === null) {
    return { status: "invalid", file: null, scripts: NO_SCRIPTS } as const;
  }
  return { status: "valid", file, scripts: file.scripts ?? NO_SCRIPTS } as const;
}

export function useLancerProjectFileScripts(
  environmentId: EnvironmentId,
  cwd: string | null,
): ReadonlyArray<LancerProjectFileScript> {
  return useLancerProjectFileState(environmentId, cwd).scripts;
}
