import { CommandBlock } from "../CommandBlock";
import { Button } from "../ui/button";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "../ui/popover";
import { SettingsRow } from "./settingsLayout";
import { searchableSetting } from "./settingsSearch";

export function MobileAppSettingsRow() {
  return (
    <SettingsRow
      {...searchableSetting("mobile-app")}
      description="Build the Lancer mobile client to connect a phone or tablet to your server."
      control={
        <Popover>
          <PopoverTrigger render={<Button size="sm" variant="outline" />}>
            Build locally
          </PopoverTrigger>
          <PopoverPopup align="end">
            <PopoverTitle>Build the mobile client</PopoverTitle>
            <p className="my-2 text-xs text-muted-foreground">
              From apps/mobile in your Lancer checkout, use the command for your device.
            </p>
            <p className="mt-2 text-xs">iOS</p>
            <CommandBlock command="vp run ios:dev" />
            <p className="mt-2 text-xs">Android</p>
            <CommandBlock command="vp run android:dev" />
          </PopoverPopup>
        </Popover>
      }
    />
  );
}
