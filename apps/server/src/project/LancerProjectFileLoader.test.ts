import * as NodeServices from "@effect/platform-node/NodeServices";
import { it, describe, expect } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Path from "effect/Path";

import * as LancerProjectFileLoader from "./LancerProjectFileLoader.ts";

const layerTest = Layer.empty.pipe(
  Layer.provideMerge(LancerProjectFileLoader.layer),
  Layer.provideMerge(NodeServices.layer),
);

const makeTempDir = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  return yield* fileSystem.makeTempDirectoryScoped({
    prefix: "lancer-project-file-",
  });
});

const writeProjectFile = Effect.fn("writeProjectFile")(function* (cwd: string, contents: string) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  yield* fileSystem.writeFileString(path.join(cwd, "lancer.json"), contents).pipe(Effect.orDie);
});

it.layer(layerTest)("LancerProjectFileLoader", (it) => {
  describe("load", () => {
    it.effect("reads a legacy config only when lancer.json is absent", () =>
      Effect.gen(function* () {
        const loader = yield* LancerProjectFileLoader.LancerProjectFileLoader;
        const cwd = yield* makeTempDir;
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        yield* fs.writeFileString(path.join(cwd, "t3.json"), '{"iconPath":"legacy.svg"}');
        expect(Option.getOrUndefined(yield* loader.load(cwd))?.iconPath).toBe("legacy.svg");
        yield* writeProjectFile(cwd, '{"iconPath":"current.svg"}');
        expect(Option.getOrUndefined(yield* loader.load(cwd))?.iconPath).toBe("current.svg");
        yield* writeProjectFile(cwd, "{ invalid");
        expect(Option.isNone(yield* loader.load(cwd))).toBe(true);
      }),
    );

    it.effect("returns none for malformed JSON without failing", () =>
      Effect.gen(function* () {
        const loader = yield* LancerProjectFileLoader.LancerProjectFileLoader;
        const cwd = yield* makeTempDir;
        yield* writeProjectFile(cwd, "{ not json");

        const loaded = yield* loader.load(cwd);

        expect(Option.isNone(loaded)).toBe(true);
      }),
    );
  });
});
