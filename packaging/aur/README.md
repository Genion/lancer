# Arch Linux packaging

The stable and nightly templates repackage an x86_64 Lancer Harness AppImage from the Lancer series repository. Generate checksums from a published Harness release before building either template. Release tags start with `harness-v`.

On Arch Linux with `base-devel`, `github-cli`, `jq` and `namcap` installed, set `RELEASE_TAG` to the Harness release and run `packaging/aur/scripts/release.sh`. The script validates the release digest and builds the package. Publishing also requires the corresponding AUR package and its SSH key.
