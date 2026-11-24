import {
  LANCER_PROJECT_FILE_NAME,
  type EnvironmentId,
  type LancerProjectFile,
} from "@lancer/contracts";
import { parseLancerProjectFile } from "@lancer/shared/lancerProjectFile";
import { executeAtomQuery } from "@lancer/client-runtime/state/runtime";

import {
  getProjectFileQueryAtom,
  resolveProjectFileQueryData,
} from "~/components/files/projectFilesQueryState";
import { appAtomRegistry } from "~/rpc/atomRegistry";

export async function readLancerProjectFile(
  environmentId: EnvironmentId,
  workspaceRoot: string,
): Promise<LancerProjectFile | null> {
  const result = await executeAtomQuery(
    appAtomRegistry,
    getProjectFileQueryAtom(environmentId, workspaceRoot, LANCER_PROJECT_FILE_NAME, true),
    { reportDefect: false, reportFailure: false },
  );
  const data = resolveProjectFileQueryData(
    environmentId,
    workspaceRoot,
    LANCER_PROJECT_FILE_NAME,
    result._tag === "Success" ? result.value : null,
  );
  if (data === null || data.exists === false || data.truncated) return null;
  return parseLancerProjectFile(data.contents);
}
