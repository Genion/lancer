# FAQ

<a name="is-t3-code-a-harness"></a>

## What does Lancer Harness do?

Lancer Harness runs business tasks in a local workspace. A person supplies an assignment and source records, and an agent delivers files or flags decisions that need human judgment. GitTree shows the steps in the task and opens the files they refer to in Files. The configured provider supplies the underlying agent runtime. [Try the product listing review](../../examples/product-claims-review/README.md).

<a name="why-use-t3-code-instead-of-claude-code-or-the-codex-app"></a>

## What does Lancer add to my provider?

Use your configured provider to do the work. Lancer supplies the local workspace, thread history, GitTree and file preview. For example, you can open a completed product claims report from the graph, inspect the evidence, and return to the same task. [Install Lancer](./install.md).

<a name="can-i-use-t3-code-with-my-claude-code-subscription"></a>

## Can I use Lancer with my Claude Code subscription?

Yes.

<a name="how-much-does-t3-code-cost"></a>

## How much does Lancer cost?

You can run this MIT-licensed checkout locally. Your provider's plan or API usage is billed under your own account. T3 Connect is an optional upstream service with its own limits. [Source license](../../LICENSE) · [T3 Connect](./remote-access.md#t3-connect)

## Can I connect more than 3 machines with T3 Connect?

Open the account menu, go to **T3 Chat**, and select **Link T3 Chat** to link an eligible account. The upstream T3 Connect service sets the machine limit. [More machines with T3 Chat](./remote-access.md#more-machines-with-t3-chat)

## Why is my Claude 5-hour limit draining so fast?

Lancer runs Claude through Anthropic's Agent SDK. Check your provider's usage dashboard for the limits on your account. The upstream project has also documented differences between SDK usage and the standalone CLI. [Upstream report](https://x.com/theo/status/2114166439813017873)

<a name="how-do-i-use-t3-code-remotely"></a>

## How do I use Lancer remotely?

Your agents run on the machine hosting the workspace. To connect from another device, pair it with the host over a reachable network or use T3 Connect. The web client served by your local Lancer checkout includes GitTree and Files. [Remote access](./remote-access.md)

<a name="how-do-i-use-t3-code-on-my-phone"></a>

## How do I use Lancer on my phone?

Open the web interface served by your Lancer host in the phone's browser and pair with that host. For the upstream native mobile clients, see the [T3 Code mobile distributions](./install.md#mobile-app). [Remote access](./remote-access.md)

## Why does T3 Connect keep disconnecting?

Open **Settings → Environments**, find the machine, and select **Details**. The first failed part identifies where the connection stopped. [T3 Connect troubleshooting](./t3-connect-troubleshooting.md)

<a name="will-i-get-banned-for-using-my-subscription"></a>

## Can I use my provider subscription?

Lancer uses the provider runtime and credentials you configure. Your provider sets the access, usage limits and terms for your account. [Provider setup](./install.md#providers)

<a name="can-i-add-a-bunch-of-accounts-for-one-provider"></a>

## Can I add more than one account for a provider?

Create a separate provider instance for each supported account or configuration. See [Codex accounts](./providers-codex.md#use-multiple-accounts) and [Claude configurations](./providers-claude.md#separate-accounts-or-configurations). If you already use a CLIProxyAPI hub, you can also [connect it to the Usage page](./usage.md#connect-a-cliproxyapi-hub).

## Can I use an API key or OpenRouter instead of a subscription?

Yes. Add another provider instance in Settings and give it its own keys and endpoint. Claude has a full OpenRouter recipe. Your subscription setup stays untouched. [OpenRouter](./providers-claude.md#openrouter) · [Provider instances](./install.md#providers)

<a name="does-t3-code-support-local-models"></a>

## Does Lancer run the model locally?

The workspace, task history and report files live on the host. Inference runs where your configured provider sends its requests. When you use a hosted model, the provider can receive the records the agent reads. [Provider setup](./install.md#providers)

<a name="does-my-code-go-to-t3-servers"></a>

## Where does my workspace data go?

A hosted model can receive prompts, tool results and file excerpts that your agent reads. T3 Connect is a separate remote-access service. When enabled, product telemetry and relay diagnostics use upstream endpoints. See [Product usage data](./telemetry.md) for the fields and controls, including optional mobile activity publishing.

## Worktrees are eating my disk. How do I clean them up?

Open **Settings → Worktrees → Cleanup** and turn on automatic worktree cleanup. You can also run it now from there. [Storage cleanup](./project-settings.md#storage-cleanup)

## Is there voice input?

Yes. On iPhone and Android, dictation uses on-device speech by default; you can opt in to a paired environment instead. Web and desktop require you to choose an environment first. The transcript goes into your draft for review. See [Voice input](./voice-input.md).

## Does it work on Windows, Mac, and Linux?

The repository includes desktop and server code for macOS, Linux and Windows. Run Lancer from the source checkout. The upstream desktop packages and platform-specific CLI availability are listed separately in the [installation guide](./install.md).

## Why is my provider not showing up?

Almost always, the CLI is not installed or not on the `PATH` of the machine that runs the server. (Not your phone. The computer.) Log in on that machine first, like `codex login` or `claude auth login`. Still missing? Point **Binary path** at it in provider settings. Version managers love to cause this one. [Provider setup](./install.md#providers)
