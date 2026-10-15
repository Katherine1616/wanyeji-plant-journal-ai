import { buildSeedLogs, SEED_COMPANIONS, SEED_PLANTS } from "./seed";
import type { CareLogDto, GardenSnapshot, MemberDto, PlantDto } from "./types";

export const DEMO_STORAGE_KEY = "balcony-journal.demo.v1";

export const DEMO_USER = {
  id: "demo_owner",
  name: "Rui Xia",
  email: "rui@example.local",
  avatarUrl: null,
};

function daysAgo(value: number) {
  const date = new Date();
  date.setHours(13, 7, 0, 0);
  date.setDate(date.getDate() - value);
  return date.toISOString();
}

export function createDemoSnapshot(): GardenSnapshot {
  const me: MemberDto = {
    id: DEMO_USER.id,
    displayName: DEMO_USER.name,
    avatarUrl: null,
    avatarColor: "#f3c2b4",
    joinedAt: daysAgo(1),
  };
  const members: MemberDto[] = [
    {
      id: SEED_COMPANIONS[0].id,
      displayName: SEED_COMPANIONS[0].displayName,
      avatarUrl: null,
      avatarColor: SEED_COMPANIONS[0].avatarColor,
      joinedAt: daysAgo(25),
    },
    {
      id: SEED_COMPANIONS[1].id,
      displayName: SEED_COMPANIONS[1].displayName,
      avatarUrl: null,
      avatarColor: SEED_COMPANIONS[1].avatarColor,
      joinedAt: daysAgo(25),
    },
    me,
  ];

  const waterers = [me.id, SEED_COMPANIONS[0].id, SEED_COMPANIONS[1].id];
  const plants: PlantDto[] = SEED_PLANTS.map((plant, index) => ({
    id: `demo_plant_${index}`,
    nickname: plant.nickname,
    species: plant.species,
    latinName: plant.latinName,
    location: plant.location,
    photoUrl: null,
    illustrationUrl: plant.illustrationUrl,
    waterIntervalDays: plant.waterIntervalDays,
    fertilizeIntervalDays: plant.fertilizeIntervalDays,
    lastFertilizedAt:
      plant.fertilizedDaysAgo === null ? null : daysAgo(plant.fertilizedDaysAgo),
    lightNeed: plant.lightNeed,
    tempRange: plant.tempRange,
    lastWateredAt: daysAgo(plant.wateredDaysAgo),
    lastWateredBy: waterers[index % waterers.length],
    createdAt: daysAgo(45 - index),
    createdBy: me.id,
    sortOrder: index,
  }));

  const seedLogs = buildSeedLogs(me.id, SEED_COMPANIONS[0].id, SEED_COMPANIONS[1].id);
  const logs: CareLogDto[] = seedLogs
    .map((log, index) => ({
      id: `demo_log_${index}`,
      plantId: plants[log.plantIndex].id,
      type: log.type,
      memberId: log.memberId,
      note: log.note ?? null,
      createdAt: daysAgo(log.daysAgo),
    }))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return {
    household: {
      id: "demo_household",
      name: "secret garden",
      inviteCode: "8DQFQ5",
      createdAt: daysAgo(25),
    },
    members,
    plants,
    logs,
    me,
    version: `demo-${logs.length}-${plants.length}`,
  };
}

export function loadDemoSnapshot(): GardenSnapshot {
  if (typeof window === "undefined") return createDemoSnapshot();
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GardenSnapshot) : createDemoSnapshot();
  } catch {
    return createDemoSnapshot();
  }
}

export function saveDemoSnapshot(snapshot: GardenSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Generated images can make browser storage full. The current session still
    // works even if the browser declines persistence.
  }
}
