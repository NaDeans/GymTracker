// src/hooks/persistent/usePersistentState.js
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook to persist state in AsyncStorage
 * @param {string} key - AsyncStorage key
 * @param {any} defaultValue - initial state value
 */
export const usePersistentState = (key, defaultValue) => {
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved) setState(JSON.parse(saved));
      } catch (err) {
        console.error(`Failed to load ${key}:`, err);
      }
    };
    load();
  }, [key]);

  useEffect(() => {
    AsyncStorage.setItem(key, JSON.stringify(state)).catch(err =>
      console.error(`Failed to save ${key}:`, err)
    );
  }, [key, state]);

  return [state, setState];
};