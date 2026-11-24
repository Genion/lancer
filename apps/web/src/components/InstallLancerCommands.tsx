import { cn } from "~/lib/utils";
import { CommandBlock } from "./CommandBlock";

export function InstallLancerCommands({
  command,
  className,
}: {
  readonly command: string;
  readonly className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground">
        Enable the Lancer CLI in desktop Settings, then run this command on the host.
      </p>
      <CommandBlock command={command} />
      <p className="text-xs text-muted-foreground">From a built Lancer source checkout, run</p>
      <CommandBlock command={command.replace(/^lancer\b/, "node apps/server/dist/bin.mjs")} />
    </div>
  );
}
