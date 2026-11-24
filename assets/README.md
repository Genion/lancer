# Lancer application artwork

The full-color launcher and browser icons use the project owner's original [Lancer artwork](lancer/icon.jpg). The supplied JPEG has SHA-256 `cb1a7d6c0f756aeb06ba985678ba51fd764c095fc94a1534942d30c2ef48af6c`. The small monochrome lance used by Android notifications and the iOS widget is in [the mobile assets](../apps/mobile/assets/widget/T3Mark.svg).

Run `vp run icons:export` to regenerate the desktop, mobile and web renditions. Run `vp run icons:check` to compare all generated files with their sources. Both commands use the repository's pinned sharp dependency. The existing channel-specific file paths support the packaging tools. All Lancer channels share the same artwork.
