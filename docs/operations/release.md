# Lancer Harness builds and releases

## Build this checkout locally

Use the [development runbook](./development.md#desktop-artifacts) to create unsigned desktop artifacts. For the mobile development client, use the [mobile guide](../../apps/mobile/README.md). Smoke-test a fresh installation with the [fictional listing review](../../examples/product-claims-review/README.md). Use synthetic records and new threads when capturing release evidence.

## Harness release workflow

The [release workflow](../../.github/workflows/release.yml) runs its initial job only in `raylee-ai/lancer` when the repository variable `LANCER_RELEASES_ENABLED` equals `true`. This is an opt-in publishing pipeline. Local builds and tests do not require that setting.

- Stable tag pushes use `harness-v<version>`. The workflow also defines scheduled nightlies and a manual dispatch with stable, nightly and preview channels. Check the selected commit and channel before dispatching it.
- A Harness release has its own tag and matching server version. Other releases in the Lancer series use different artifacts. A matching-looking version alone does not identify a Harness binary.
- The CLI archive, desktop package and checksums are separate assets. The runner fetches `SHA256SUMS` from the Harness version's release directory and verifies its platform archive before installing it.
- The scoped launcher package is `@raylee-ai/lancer-harness`, with `lancer` as its executable. The npm launcher publishing step requires the additional repository variable `LANCER_NPM_PUBLISH_ENABLED=true` and runs after GitHub Release publication. Before enabling publishing, verify the registry package, publisher ownership and OIDC workflow registration as well as the intended signing and hosting destinations. The [install guide](../user/install.md#run-from-source) runs the current checkout from source.

### Windows payload topology and update validation

Windows packages its server and native dependencies in Electron resources. The native backend reads the server archive in place. The WSL backend uses the matching Linux archive and SHA-256 sidecar. Before distributing a Windows build, exercise both backends and check that shell integration, settings and the local workspace open after a restart. See the [desktop workflow](../../.github/workflows/release-desktop.yml) for the archive inputs.

## Apple signing and notarization

Configure a signing identity owned by the Lancer publisher. The desktop workflow accepts `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_API_KEY`, `APPLE_API_KEY_ID` and `APPLE_API_ISSUER` through repository secrets. Passkey support additionally requires the [associated-domain and entitlement configuration](./connect-setup.md#desktop-passkeys) for the Lancer bundle identifier. Keep certificates and private keys outside the source tree.

## Managed tunnel cleanup rollout

Managed tunnel cleanup belongs to the deployment administering the relay. Confirm which relay owns each endpoint before changing a deployment. Use that deployment’s diagnostics to verify recovery registration and observe a disposable host across disconnect and reconnect. A local Harness build requires no changes to any hosted relay. See [relay observability](./relay-observability.md).
