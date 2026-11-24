import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import {
  LEGACY_PROJECT_FILE_NAME,
  LANCER_PROJECT_FILE_NAME,
  type LancerProjectFile,
} from "@lancer/contracts";
import { LancerProjectFileFromJson } from "@lancer/shared/lancerProjectFile";

const decodeLancerProjectFileJson = Schema.decodeEffect(LancerProjectFileFromJson);

export class LancerProjectFileLoadError extends Schema.TaggedError<LancerProjectFileLoadError>()(
  "LancerProjectFileLoadError",
  {
    operation: Schema.Literals(["read", "decode"]),
    workspaceRoot: Schema.String,
    filePath: Schema.String,
    cause: Schema.Defect(),
  },
) {
  override get message(): string {
    return `Failed to ${this.operation} ${LANCER_PROJECT_FILE_NAME} at ${this.filePath}.`;
  }
}

export class LancerProjectFileLoader extends Context.Service<
  LancerProjectFileLoader,
  {
    /** Never fails; missing/unreadable/invalid files return none, with warnings for invalid files. */
    readonly load: (workspaceRoot: string) => Effect.Effect<Option.Option<LancerProjectFile>>;
  }
>()("lancer/project/LancerProjectFileLoader") {}

const logLancerProjectFileLoadError = (error: LancerProjectFileLoadError) =>
  Effect.logWarning(error).pipe(
    Effect.annotateLogs({
      operation: error.operation,
      workspaceRoot: error.workspaceRoot,
      filePath: error.filePath,
      errorTag: error._tag,
    }),
  );

/** Prefer the Lancer config, including when it is invalid. Only absence enables the legacy name. */
export const readProjectConfig = Effect.fn("readProjectConfig")(function* (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  workspaceRoot: string,
) {
  const read = (name: string) => {
    const filePath = path.join(workspaceRoot, name);
    return fs.readFileString(filePath).pipe(Effect.map((contents) => ({ contents, filePath })));
  };
  return yield* read(LANCER_PROJECT_FILE_NAME).pipe(
    Effect.catchIf(
      (error) => error.reason._tag === "NotFound",
      () => read(LEGACY_PROJECT_FILE_NAME),
    ),
  );
});

/** @public */
export const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const load: LancerProjectFileLoader["Service"]["load"] = Effect.fn(
    "LancerProjectFileLoader.load",
  )(function* (workspaceRoot) {
    const filePath = path.join(workspaceRoot, LANCER_PROJECT_FILE_NAME);
    const raw = yield* readProjectConfig(fs, path, workspaceRoot).pipe(
      Effect.asSome,
      Effect.catchTags({
        PlatformError: (error) =>
          error.reason._tag === "NotFound"
            ? Effect.succeed(Option.none<{ contents: string; filePath: string }>())
            : logLancerProjectFileLoadError(
                new LancerProjectFileLoadError({
                  operation: "read",
                  workspaceRoot,
                  filePath,
                  cause: error,
                }),
              ).pipe(Effect.as(Option.none<{ contents: string; filePath: string }>())),
      }),
    );
    if (Option.isNone(raw)) {
      return Option.none<LancerProjectFile>();
    }
    return yield* decodeLancerProjectFileJson(raw.value.contents).pipe(
      Effect.asSome,
      Effect.catchTags({
        SchemaError: (error) =>
          logLancerProjectFileLoadError(
            new LancerProjectFileLoadError({
              operation: "decode",
              workspaceRoot,
              filePath: raw.value.filePath,
              cause: error,
            }),
          ).pipe(Effect.as(Option.none<LancerProjectFile>())),
      }),
    );
  });

  return LancerProjectFileLoader.of({ load });
});

export const layer = Layer.effect(LancerProjectFileLoader, make);
