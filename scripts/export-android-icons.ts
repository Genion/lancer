#!/usr/bin/env node

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import sharp from "sharp";
import { renderIcon } from "./lib/icon-export.ts";

export const renderAndroidIcons = Effect.fn("lancerIcons.renderAndroid")(function* (root: string) {
  const path = yield* Path.Path;
  const dir = "apps/mobile/assets";
  const art = path.join(root, "assets/lancer/icon.jpg");
  const mark = path.join(root, dir, "widget/T3Mark.svg");
  const edge = "#0f232e";
  const sizes = { adaptive: 432, splash: 1152, notification: 96 } as const;
  const render = (input: string, size: number) =>
    renderIcon(input, () => sharp(input, { density: 300 }).resize(size, size).png().toBuffer());
  // Android masks the artwork. Keep the mark inside its central two-thirds safe area.
  const inset = (image: Buffer, size: number, background: string) =>
    renderIcon("Android safe area", () =>
      sharp(image)
        .resize(size, size, { fit: "contain", background, withoutEnlargement: true })
        .png()
        .toBuffer(),
    );
  const background = yield* renderIcon("Android background", () =>
    sharp({
      create: { width: sizes.adaptive, height: sizes.adaptive, channels: 3, background: edge },
    })
      .png()
      .toBuffer(),
  );
  const transparent = "#00000000";
  const foreground = yield* render(art, sizes.adaptive);
  const splash = yield* inset(yield* render(art, 768), sizes.splash, edge);
  const mono = yield* inset(yield* render(mark, 272), sizes.adaptive, transparent);
  return new Map<string, Buffer>([
    [dir + "/android-icon-foreground.png", foreground],
    [dir + "/android-icon-background-dev.png", background],
    [dir + "/android-icon-background-nightly.png", background],
    [dir + "/android-splash-icon-dev.png", splash],
    [dir + "/android-splash-icon-nightly.png", splash],
    [dir + "/android-splash-icon-prod.png", splash],
    [dir + "/android-icon-mark.png", mono],
    [dir + "/android-notification-icon.png", yield* render(mark, sizes.notification)],
  ]);
});

if (import.meta.main) {
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const root = yield* path.fromFileUrl(new URL("..", import.meta.url));
    for (const [name, contents] of yield* renderAndroidIcons(root)) {
      yield* fs.writeFile(path.join(root, name), contents);
    }
  }).pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain);
}
