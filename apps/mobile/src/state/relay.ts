import { createRelayEnvironmentDiscoveryAtoms } from "@lancer/client-runtime/state/relay";

import { connectionAtomRuntime } from "../connection/runtime";

export const relayEnvironmentDiscovery =
  createRelayEnvironmentDiscoveryAtoms(connectionAtomRuntime);
