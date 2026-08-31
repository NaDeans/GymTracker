import { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { purgeRemovedFeatureData } from "./src/shared/utils/legacyCleanup";

export default function App() {
  useEffect(() => {
    purgeRemovedFeatureData();
  }, []);

  return <AppNavigator />;
}
