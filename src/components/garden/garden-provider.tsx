"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CareLogDto,
  CareLogType,
  GardenSnapshot,
  LightNeed,
  MemberDto,
  PlantDto,
} from "@/lib/garden/types";
import {
  createDemoSnapshot,
  DEMO_USER,
  loadDemoSnapshot,
  saveDemoSnapshot,
} from "@/lib/garden/demo-store";

export type NewPlantInput = {
  nickname: string;
  species: string;
  latinName?: string;
  location: string;
  photoUrl?: string | null;
  illustrationUrl: string;
  waterIntervalDays: number;
  fertilizeIntervalDays?: number;
  lightNeed?: LightNeed;
  tempRange?: string;
  lastWateredAt?: string;
};

type WaterResult = { plant: PlantDto; log: CareLogDto } | null;

type GardenContextValue = {
  user: typeof DEMO_USER;
  snapshot: GardenSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  water: (plantId: string) => Promise<WaterResult>;
  care: (plantId: string, type: CareLogType, note?: string) => Promise<WaterResult>;
  undo: (logId: string) => Promise<void>;
  addPlant: (input: NewPlantInput) => Promise<PlantDto>;
  savePlant: (plantId: string, patch: Record<string, unknown>) => Promise<PlantDto>;
  createNewHousehold: (name: string, displayName: string) => Promise<void>;
  joinExistingHousehold: (code: string, displayName: string) => Promise<void>;
  renameHousehold: (name: string) => Promise<void>;
  renameMe: (displayName: string) => Promise<void>;
  memberById: (id: string | null | undefined) => MemberDto | undefined;
};

const GardenContext = createContext<GardenContextValue | null>(null);

export function GardenProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<GardenSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setSnapshot(loadDemoSnapshot());
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (snapshot) saveDemoSnapshot(snapshot);
  }, [snapshot]);

  const applyPlant = useCallback((plant: PlantDto, log?: CareLogDto) => {
    setSnapshot((current) => {
      if (!current) return current;
      const plants = current.plants.map((item) => (item.id === plant.id ? plant : item));
      const logs = log ? [log, ...current.logs] : current.logs;
      return {
        ...current,
        plants,
        logs,
        version: `${logs.length}-${plants.length}-${current.members.length}`,
      };
    });
  }, []);

  const care = useCallback(
    async (plantId: string, type: CareLogType, note?: string) => {
      const current = snapshot?.plants.find((plant) => plant.id === plantId);
      if (!current) return null;
      const now = new Date().toISOString();
      const plant: PlantDto = {
        ...current,
        ...(type === "water" ? { lastWateredAt: now, lastWateredBy: DEMO_USER.id } : {}),
        ...(type === "fertilize" ? { lastFertilizedAt: now } : {}),
      };
      const log: CareLogDto = {
        id: crypto.randomUUID(),
        plantId,
        type,
        memberId: DEMO_USER.id,
        note: note?.trim() || null,
        createdAt: now,
      };
      applyPlant(plant, log);
      return { plant, log };
    },
    [applyPlant, snapshot?.plants],
  );

  const water = useCallback((plantId: string) => care(plantId, "water"), [care]);

  const undo = useCallback(async (logId: string) => {
    setSnapshot((current) => {
      if (!current) return current;
      const removed = current.logs.find((entry) => entry.id === logId);
      const remaining = current.logs.filter((entry) => entry.id !== logId);
      if (!removed || removed.type !== "water") return { ...current, logs: remaining };
      const previous = remaining
        .filter((entry) => entry.plantId === removed.plantId && entry.type === "water")
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
      return {
        ...current,
        logs: remaining,
        plants: current.plants.map((plant) =>
          plant.id === removed.plantId && previous
            ? { ...plant, lastWateredAt: previous.createdAt, lastWateredBy: previous.memberId }
            : plant,
        ),
      };
    });
  }, []);

  const addPlant = useCallback(
    async (input: NewPlantInput) => {
      const now = new Date().toISOString();
      const plant: PlantDto = {
        id: crypto.randomUUID(),
        nickname: input.nickname,
        species: input.species,
        latinName: input.latinName ?? null,
        location: input.location,
        photoUrl: input.photoUrl ?? null,
        illustrationUrl: input.illustrationUrl,
        waterIntervalDays: input.waterIntervalDays,
        fertilizeIntervalDays: input.fertilizeIntervalDays ?? 30,
        lastFertilizedAt: null,
        lightNeed: input.lightNeed ?? "indirect",
        tempRange: input.tempRange ?? "15–28°C",
        lastWateredAt: input.lastWateredAt ?? now,
        lastWateredBy: DEMO_USER.id,
        createdAt: now,
        createdBy: DEMO_USER.id,
        sortOrder: snapshot?.plants.length ?? 0,
      };
      setSnapshot((current) =>
        current ? { ...current, plants: [...current.plants, plant] } : current,
      );
      return plant;
    },
    [snapshot?.plants.length],
  );

  const savePlant = useCallback(
    async (plantId: string, patch: Record<string, unknown>) => {
      const current = snapshot?.plants.find((plant) => plant.id === plantId);
      if (!current) throw new Error("plant_not_found");
      const plant = { ...current, ...patch } as PlantDto;
      applyPlant(plant);
      return plant;
    },
    [applyPlant, snapshot?.plants],
  );

  const createNewHousehold = useCallback(async (name: string, displayName: string) => {
    const fresh = createDemoSnapshot();
    fresh.household.name = name;
    fresh.me.displayName = displayName;
    fresh.members = fresh.members.map((member) => (member.id === fresh.me.id ? fresh.me : member));
    setSnapshot(fresh);
  }, []);

  const joinExistingHousehold = useCallback(async (code: string, displayName: string) => {
    const fresh = createDemoSnapshot();
    fresh.household.inviteCode = code || fresh.household.inviteCode;
    fresh.me.displayName = displayName;
    setSnapshot(fresh);
  }, []);

  const renameHousehold = useCallback(async (name: string) => {
    setSnapshot((current) =>
      current ? { ...current, household: { ...current.household, name } } : current,
    );
  }, []);

  const renameMe = useCallback(async (displayName: string) => {
    setSnapshot((current) => {
      if (!current) return current;
      const me = { ...current.me, displayName };
      return {
        ...current,
        me,
        members: current.members.map((member) => (member.id === me.id ? me : member)),
      };
    });
  }, []);

  const memberById = useCallback(
    (id: string | null | undefined) => {
      if (!id || !snapshot) return undefined;
      return snapshot.me.id === id
        ? snapshot.me
        : snapshot.members.find((member) => member.id === id);
    },
    [snapshot],
  );

  const value = useMemo<GardenContextValue>(
    () => ({
      user: DEMO_USER,
      snapshot,
      loading,
      error: null,
      refresh,
      water,
      care,
      undo,
      addPlant,
      savePlant,
      createNewHousehold,
      joinExistingHousehold,
      renameHousehold,
      renameMe,
      memberById,
    }),
    [
      snapshot,
      loading,
      refresh,
      water,
      care,
      undo,
      addPlant,
      savePlant,
      createNewHousehold,
      joinExistingHousehold,
      renameHousehold,
      renameMe,
      memberById,
    ],
  );

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>;
}

export function useGarden() {
  const context = useContext(GardenContext);
  if (!context) throw new Error("useGarden must be used inside GardenProvider");
  return context;
}
