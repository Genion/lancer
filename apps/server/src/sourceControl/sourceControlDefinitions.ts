import * as AzureDevOpsDriver from "@lancer/source-control-azure-devops/server/driver";
import * as BitbucketDriver from "@lancer/source-control-bitbucket/server/driver";
import { builtInSourceControlDefinitions } from "@lancer/source-control-definitions/registry";
import * as ForgejoDriver from "@lancer/source-control-forgejo/server/driver";
import * as GitCafeDriver from "@lancer/source-control-gitcafe/server/driver";
import * as GitHubDriver from "@lancer/source-control-github/server/driver";
import * as GitLabDriver from "@lancer/source-control-gitlab/server/driver";

/** In the shared registry's order, which is the order hosts are listed and probed in. */
export const BUILT_IN_SOURCE_CONTROL_DRIVER_LIST = [
  GitHubDriver.driver,
  GitLabDriver.driver,
  GitCafeDriver.driver,
  ForgejoDriver.driver,
  BitbucketDriver.driver,
  AzureDevOpsDriver.driver,
] as const;

export const sourceControlDefinitions = builtInSourceControlDefinitions;
