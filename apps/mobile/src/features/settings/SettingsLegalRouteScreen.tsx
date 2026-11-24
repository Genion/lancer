import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";

import { AppText as Text } from "../../components/ui/AppText";
import { SheetHeader } from "../../components/ui/SheetHeader";
import { SettingsLegalDocumentRouteScreen } from "./components/SettingsLegalDocumentRouteScreen";
import { LEGAL_URL } from "./lib/legal-document-url";

export function SettingsLegalRouteScreen() {
  const navigation = useNavigation();
  if (LEGAL_URL) {
    return <SettingsLegalDocumentRouteScreen documentName="Project notices" documentUrl={LEGAL_URL} />;
  }
  return (
    <View className="flex-1 bg-sheet">
      <SheetHeader
        title="Project notices"
        accessibilityLabel="Close project notices"
        onClose={() => navigation.goBack()}
      />
      <View className="gap-4 p-5">
        <Text className="text-base text-foreground">
          Lancer Harness is distributed under the MIT license. The source checkout includes the
          copyright notices and third-party licenses.
        </Text>
        <Text className="text-base text-foreground">
          Your connected model provider can receive the messages and workspace files used for a task.
          Keep workspace pairing links and provider credentials private.
        </Text>
      </View>
    </View>
  );
}
