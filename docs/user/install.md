<a name="install-t3-code"></a>

# Install Lancer

## Requirements

Install Vite+ on the machine that will run Lancer. An authenticated provider is needed to start an agent thread. See the [development prerequisites](../operations/development.md).

## Run from source

Open the Lancer checkout on the machine where the agent will work. Run the following from the repository root:

```sh
vp i
vp run dev
```

Open the local pairing URL printed by the launcher. To use the Electron app, run `vp run dev:desktop` instead. Both launchers keep development state in `.lancer-runtime` inside this checkout. Select your model provider in [provider settings](#providers).

## Command line

The local launcher starts the server and prints its pairing URL. Commands in these guides use `lancer` for the packaged executable. In a source checkout, use `node apps/server/src/bin.ts` in its place. For commands that need the local development state, pass `--base-dir .lancer-runtime` where supported. To see the CLI commands provided by this source revision, run the following in the checkout using the Node version pinned in `package.json` after installing dependencies.

```sh
node apps/server/src/bin.ts --help
```

## Desktop app

Use `vp run dev:desktop` to open the Electron client. For a local packaged build, see the [desktop build instructions](../operations/development.md#desktop-artifacts).

## Mobile app

Open the web client served by your Lancer host, or build the native client from this checkout using the [mobile development guide](../../apps/mobile/README.md). Packages in the [upstream mobile stores](https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md#mobile-app) are distributed by T3 Code.

## Providers

Open **Settings → Providers** in the web or desktop app, select the environment,
and enable the provider you want. Installation, login, and configuration belong
to that environment's machine, even when you connect from a phone or another
computer.

| Provider    | Install and authenticate                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex       | [Connect with ChatGPT](./providers-codex.md#connect-with-chatgpt), or install [Codex CLI](https://developers.openai.com/codex/cli) and run `codex login`. |
| Claude      | Install [Claude Code](https://claude.com/product/claude-code), then run `claude auth login`.                                                              |
| Cursor      | Install [Cursor CLI](https://cursor.com/cli), then run `agent login`.                                                                                     |
| Grok Build  | Install [Grok Build CLI](https://x.ai/cli), then run `grok login`.                                                                                        |
| Kiro        | Install [Kiro CLI](https://kiro.dev/docs/cli/), then run `kiro-cli login`.                                                                                |
| OpenCode    | Install [OpenCode](https://opencode.ai), then run `opencode auth login`.                                                                                  |
| Antigravity | Install and sign in with Google from Lancer's provider settings.                                                                                          |
| Pi          | Install [Pi](./providers-pi.md#set-up-pi) with Node.js 22.19 or newer, then run `pi` and `/login`.                                                        |
| Muse Code   | Install [Muse Code](https://dev.meta.ai/docs/muse-code) on the server, run `muse login`, then enable it in Settings → Providers.                          |
| fx          | Install [fx](https://fx.sh) with `curl -fsSL https://fx.sh/setup.sh \| bash`, then run `fx login`.                                                        |

Provider CLIs must be on the server's `PATH`. If Lancer cannot find one, set its
**Binary path** in provider settings, especially when using a version manager.
Cursor's executable is `cursor-agent`, although its login command is
`agent login`. Codex connected through ChatGPT and Antigravity can use their
managed runtimes without a `PATH` entry.

Lancer warns when a provider version has known compatibility problems with your
release. Check **Settings → Providers** on that environment for the recommended
version or range. When its package manager supports installing a specific version,
you can install the recommendation there. Otherwise use the provider's installer
on the environment's machine. An unlisted version is unverified.

When a provider CLI is behind its latest release, its provider card shows the
available version. **Update now** runs the installer that owns the CLI
(Homebrew, mise, or a global npm, pnpm, Yarn, Bun, Volta, or Vite+ install), or
the CLI's own update command when Lancer cannot tell. Lancer runs `mise upgrade`
only for a tool your mise config requests as `latest` when the provider's binary
path is a mise shim or under the tool's `installs/<tool>/latest` link; update a
pinned version, or a path into one version's directory, through mise yourself.
Cursor and Antigravity update with Lancer. Homebrew and Chocolatey installs
compare against the version their package manager offers, which can trail the
npm release; update Claude installed with Chocolatey through Chocolatey.

Add another provider instance for a separate account or configuration. Each
instance can have its own environment variables, such as API keys or a custom
base URL. Mark secret values as sensitive; after saving, Lancer does not display
their original values.

For provider-specific setup and accounts, see [Codex](./providers-codex.md),
[Claude](./providers-claude.md), [OpenCode](./providers-opencode.md),
[Antigravity](./providers-antigravity.md), [Kiro](./providers-kiro.md),
[Pi](./providers-pi.md), [Muse Code](./providers-muse.md), and [fx](./providers-fx.md).

## Next steps

- [Working with threads](./thread-sidebar.md): start tasks and organize parallel work.
- [Permission modes](./permission-modes.md): choose when agents ask before acting.
- [Remote access](./remote-access.md): connect from another device.
- [Running in the background](./background-service.md): keep a Linux or macOS host available.
- [Updating Lancer](./updating.md): update the app and connected servers.
- [Managed policy](./managed-policy.md): configure Lancer for everyone on a machine.
