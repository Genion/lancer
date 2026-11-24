import type { OrchestrationV2TurnItem } from "@lancer/contracts";
import { renderCodexInlineDirectivesAsMarkdown } from "@lancer/shared/codexMarkdownDirectives";
import { parseMarkdownFileLink } from "@lancer/shared/markdownLinks";
import { isWindowsDrivePath } from "@lancer/shared/path";
import { collectToolFilePaths } from "@lancer/shared/toolActivity";
import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { resolveDiffPathForWorkspace } from "../../diffFileActions";

export interface GitTreeWorkspace {
  readonly workspaceRoot: string | undefined;
  readonly repositoryRoot?: string | undefined;
}

type AssistantMessage = Extract<OrchestrationV2TurnItem, { type: "assistant_message" }>;
const messagePaths = new WeakMap<AssistantMessage, readonly string[]>();

function assistantFilePaths(item: AssistantMessage): readonly string[] {
  const cached = messagePaths.get(item);
  if (cached) return cached;
  const markdown = renderCodexInlineDirectivesAsMarkdown(item.text);
  if (!markdown.includes("[")) return [];

  // The graph updates on every turn event. Parse each finished message once and retain only
  // its actual links, so fenced examples and unused reference definitions do not become files.
  const definitions = new Map<string, string>();
  const links: Array<{ href: string } | { identifier: string }> = [];
  function visit(node: Nodes) {
    if (node.type === "definition" && !definitions.has(node.identifier)) {
      definitions.set(node.identifier, node.url);
    } else if (node.type === "link" || node.type === "image") {
      links.push({ href: node.url });
    } else if (node.type === "linkReference" || node.type === "imageReference") {
      links.push({ identifier: node.identifier });
    }
    if ("children" in node) node.children.forEach(visit);
  }
  visit(fromMarkdown(markdown));
  const paths = links.flatMap((link) => {
    const href = "href" in link ? link.href : definitions.get(link.identifier);
    return href ? (parseMarkdownFileLink(href)?.path ?? []) : [];
  });
  messagePaths.set(item, paths);
  return paths;
}

function toolFilePaths(payload: unknown): string[] {
  const paths = collectToolFilePaths(payload);
  if (!payload || typeof payload !== "object") return paths;
  const fields = payload as Record<string, unknown>;
  for (const key of [
    "inputFile",
    "input_file",
    "inputPath",
    "input_path",
    "outputFile",
    "output_file",
    "outputPath",
    "output_path",
    "notebook_path",
  ]) {
    if (typeof fields[key] === "string") paths.push(fields[key]);
  }
  if (Array.isArray(fields.paths)) {
    for (const path of fields.paths) if (typeof path === "string") paths.push(path);
  }
  return paths;
}

function recordedPaths(item: OrchestrationV2TurnItem): readonly string[] {
  switch (item.type) {
    case "file_change":
      return item.changes?.length
        ? item.changes
            .filter((change) => !isDeletion(change.operation))
            .map((change) => change.path)
        : [item.fileName];
    case "file_search":
      return item.results?.map((result) => result.fileName) ?? [];
    case "checkpoint":
      return item.files.filter((file) => !isDeletion(file.kind)).map((file) => file.path);
    case "dynamic_tool":
      return [
        ...(item.viewedImagePath ? [item.viewedImagePath] : []),
        ...toolFilePaths(item.input),
        ...toolFilePaths(item.output),
      ];
    case "assistant_message":
      return item.streaming ? [] : assistantFilePaths(item);
    default:
      return [];
  }
}

function isDeletion(kind: string) {
  return /^(?:D|delete|deleted|remove|removed)$/i.test(kind);
}

export function workspaceFilesForItem(
  item: OrchestrationV2TurnItem,
  workspace: GitTreeWorkspace,
): string[] {
  if (!workspace.workspaceRoot) return [];
  const paths = new Set<string>();
  for (const raw of recordedPaths(item)) {
    const filePath = raw.trim().replaceAll("\\", "/");
    if (
      !filePath ||
      /[\u0000-\u001f]/u.test(filePath) ||
      filePath.endsWith("/") ||
      filePath === "~" ||
      filePath.startsWith("~/") ||
      (/^[a-z][a-z\d+.-]*:/i.test(filePath) && !isWindowsDrivePath(filePath))
    )
      continue;
    const relativePath = resolveDiffPathForWorkspace({
      filePath,
      workspaceRoot: workspace.workspaceRoot,
      repositoryRoot: item.type === "checkpoint" ? workspace.repositoryRoot : undefined,
    });
    if (relativePath) paths.add(relativePath);
  }
  return [...paths];
}
