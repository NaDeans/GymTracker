import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fmt } from "shared/utils/numberUtils";
import {
  kgToLb, lbToKg,
  kcalToKj, kjToKcal,
  mlToCups, cupsToMl,
  cmToFtIn, ftInToCm,
  parseInput,
} from "../utils/conversionUtils";

const STORAGE_KEY = "CALCULATOR_VALUES";

export const useCalculator = () => {
  const [weightKg, setWeightKg] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [energyKcal, setEnergyKcal] = useState("");
  const [energyKj, setEnergyKj] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [volumeMl, setVolumeMl] = useState("");
  const [volumeCups, setVolumeCups] = useState("");
  const [ormWeight, setOrmWeight] = useState("");
  const [ormReps, setOrmReps] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setWeightKg(parsed.weightKg || "");
      setWeightLb(parsed.weightLb || "");
      setEnergyKcal(parsed.energyKcal || "");
      setEnergyKj(parsed.energyKj || "");
      setHeightCm(parsed.heightCm || "");
      setHeightFt(parsed.heightFt || "");
      setHeightIn(parsed.heightIn || "");
      setVolumeMl(parsed.volumeMl || "");
      setVolumeCups(parsed.volumeCups || "");
      setOrmWeight(parsed.ormWeight || "");
      setOrmReps(parsed.ormReps || "");
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      weightKg, weightLb,
      energyKcal, energyKj,
      heightCm, heightFt, heightIn,
      volumeMl, volumeCups,
      ormWeight, ormReps,
    }));
  }, [weightKg, weightLb, energyKcal, energyKj, heightCm, heightFt, heightIn, volumeMl, volumeCups, ormWeight, ormReps]);

  const updateWeightKg = (text) => {
    setWeightKg(text);
    const n = parseInput(text);
    setWeightLb(n === null ? "" : fmt(kgToLb(n)));
  };
  const updateWeightLb = (text) => {
    setWeightLb(text);
    const n = parseInput(text);
    setWeightKg(n === null ? "" : fmt(lbToKg(n)));
  };

  const updateEnergyKcal = (text) => {
    setEnergyKcal(text);
    const n = parseInput(text);
    setEnergyKj(n === null ? "" : fmt(kcalToKj(n)));
  };
  const updateEnergyKj = (text) => {
    setEnergyKj(text);
    const n = parseInput(text);
    setEnergyKcal(n === null ? "" : fmt(kjToKcal(n)));
  };

  const updateVolumeMl = (text) => {
    setVolumeMl(text);
    const n = parseInput(text);
    setVolumeCups(n === null ? "" : fmt(mlToCups(n)));
  };
  const updateVolumeCups = (text) => {
    setVolumeCups(text);
    const n = parseInput(text);
    setVolumeMl(n === null ? "" : fmt(cupsToMl(n)));
  };

  const recomputeCmFrom = (ftText, inText) => {
    if (ftText.trim() === "" && inText.trim() === "") {
      setHeightCm("");
      return;
    }
    const ft = parseInput(ftText) ?? 0;
    const inch = parseInput(inText) ?? 0;
    setHeightCm(fmt(ftInToCm(ft, inch)));
  };

  const updateHeightCm = (text) => {
    setHeightCm(text);
    const n = parseInput(text);
    if (n === null) {
      setHeightFt("");
      setHeightIn("");
      return;
    }
    const { ft, inch } = cmToFtIn(n);
    setHeightFt(String(ft));
    setHeightIn(fmt(inch));
  };
  const updateHeightFt = (text) => {
    setHeightFt(text);
    recomputeCmFrom(text, heightIn);
  };
  const updateHeightIn = (text) => {
    setHeightIn(text);
    recomputeCmFrom(heightFt, text);
  };

  return {
    weightKg, updateWeightKg,
    weightLb, updateWeightLb,
    energyKcal, updateEnergyKcal,
    energyKj, updateEnergyKj,
    heightCm, updateHeightCm,
    heightFt, updateHeightFt,
    heightIn, updateHeightIn,
    volumeMl, updateVolumeMl,
    volumeCups, updateVolumeCups,
    ormWeight, setOrmWeight,
    ormReps, setOrmReps,
  };
};
