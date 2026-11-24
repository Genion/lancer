<a name="updating-t3-code"></a>

# Updating Lancer

## Update the source checkout

Finish any active local task and stop the launcher. Update the checkout to your intended Lancer revision, then run `vp i` and restart with `vp run dev` or `vp run dev:desktop`. The launcher uses the same `.lancer-runtime` directory. Keep any local commits when you update your branch. See [Run from source](./install.md#run-from-source).

## Update providers

Provider executables and authentication belong to the machine running the agent. Open **Settings → Providers** to check installed versions and compatibility. See the [provider setup guide](./install.md#providers) for the provider you use.

## Update local desktop or mobile builds

Rebuild the client from the same Lancer revision as your server. Follow the [desktop build instructions](../operations/development.md#desktop-artifacts) or the [native client guide](../../apps/mobile/README.md).

The [Lancer series repository](https://github.com/raylee-ai/lancer) contains multiple lines of work. Check that a source revision or artifact identifies **Lancer Harness** before applying it to this installation. For installations distributed by T3 Code, see the [upstream update guide](https://github.com/pingdotgg/t3code/blob/main/docs/user/updating.md).
