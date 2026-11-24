import { makeSecretProviderDefinitionRegistry } from "@lancer/secret-provider-core/shared/definition";
import * as OnePassword from "@lancer/secret-provider-onepassword/shared/definition";

export const builtInSecretProviderDefinitions = makeSecretProviderDefinitionRegistry([
  OnePassword.definition,
]);
