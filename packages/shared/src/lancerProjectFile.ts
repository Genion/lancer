import * as Exit from "effect/Exit";
import * as Schema from "effect/Schema";

import { LancerProjectFile, LANCER_PROJECT_FILE_SCHEMA_URL } from "@lancer/contracts";

import { fromLenientJson } from "./schemaJson.ts";

export const LancerProjectFileFromJson = fromLenientJson(LancerProjectFile);

const decodeLancerProjectFile = Schema.decodeExit(LancerProjectFileFromJson);

export function parseLancerProjectFile(contents: string): LancerProjectFile | null {
  const decoded = decodeLancerProjectFile(contents);
  return Exit.isSuccess(decoded) ? decoded.value : null;
}

export function buildLancerProjectFileJsonSchema(): Record<string, unknown> {
  const document = Schema.toJsonSchemaDocument(LancerProjectFile, { onExcessProperty: "error" });
  const jsonSchema: Record<string, unknown> = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: LANCER_PROJECT_FILE_SCHEMA_URL,
    ...document.schema,
  };
  if (document.definitions && Object.keys(document.definitions).length > 0) {
    jsonSchema.$defs = document.definitions;
  }
  return jsonSchema;
}
