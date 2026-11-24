import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";

import { resolveUserDataPath } from "./DesktopUserData.ts";

it.effect.each([true, false])(
  "isolates the Lancer browser profile (development=%s)",
  (isDevelopment) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const directory = yield* fs.makeTempDirectoryScoped({ prefix: "lancer-profile-" });
      const existing = path.join(directory, "t3code-v2");
      yield* fs.makeDirectory(existing, { recursive: true });
      yield* fs.writeFileString(path.join(existing, "Local State"), "existing Lancer state");
      const resolved = yield* resolveUserDataPath({
        appDataDirectory: directory,
        isDevelopment,
        platform: "win32",
      });
      assert.equal(
        resolved,
        path.join(directory, isDevelopment ? "lancer-harness-dev" : "lancer-harness"),
      );
      assert.equal(
        yield* fs.readFileString(path.join(existing, "Local State")),
        "existing Lancer state",
      );
      assert.isFalse(yield* fs.exists(resolved));
      const previous = path.join(directory, isDevelopment ? "lancer-t3-dev" : "lancer-t3");
      yield* fs.makeDirectory(previous, { recursive: true });
      const options = { appDataDirectory: directory, isDevelopment, platform: "win32" } as const;
      assert.equal(yield* resolveUserDataPath(options), previous);
      yield* fs.makeDirectory(resolved, { recursive: true });
      assert.equal(yield* resolveUserDataPath(options), resolved);
    }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
);
