import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  git: { deploymentEnabled: false },
  installCommand: "npm install -g vite-plus && vp install --filter '@lancer/marketing...'",
  buildCommand: "vp run --filter @lancer/marketing build",
  outputDirectory: "dist",
  trailingSlash: false,
};
