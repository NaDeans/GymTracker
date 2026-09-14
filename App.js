import { useEffect, useState } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { purgeRemovedFeatureData } from "./src/shared/utils/legacyCleanup";
import { migrateMealPrepsOffRecipesKey } from "./src/shared/utils/migrations";

export default function App() {
  // Gated rather than fire-and-forget: the Recipes hook would otherwise be free
  // to load — and then save over — meal preps still sitting under its key.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([purgeRemovedFeatureData(), migrateMealPrepsOffRecipesKey()]).finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <AppNavigator />;
}
