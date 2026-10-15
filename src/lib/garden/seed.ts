import type { CareLogType, LightNeed } from "./types";

/**
 * Sample balcony shipped with every new household so the first visit already
 * shows the four leaf states, the care calendar states and a real journal.
 * Times are stored as whole days before "today" and resolved at insert time.
 */
export type SeedPlant = {
  nickname: string;
  species: string;
  latinName: string;
  location: string;
  illustrationUrl: string;
  waterIntervalDays: number;
  fertilizeIntervalDays: number;
  lightNeed: LightNeed;
  tempRange: string;
  /** Days since the most recent watering, matching the brief's sample table. */
  wateredDaysAgo: number;
  fertilizedDaysAgo: number | null;
  /** Watering history before the latest one, as days ago. */
  history: number[];
};

export const SEED_PLANTS: SeedPlant[] = [
  {
    nickname: "客厅的大龟背",
    species: "龟背竹",
    latinName: "Monstera deliciosa",
    location: "客厅窗边",
    illustrationUrl: "/plants/cell-4.png",
    waterIntervalDays: 7,
    fertilizeIntervalDays: 30,
    lightNeed: "indirect",
    tempRange: "18–28°C",
    wateredDaysAgo: 2,
    fertilizedDaysAgo: 12,
    history: [2, 9, 17, 25],
  },
  {
    nickname: "琴叶先生",
    species: "琴叶榕",
    latinName: "Ficus lyrata",
    location: "客厅窗边",
    illustrationUrl: "/plants/cell-3.png",
    waterIntervalDays: 7,
    fertilizeIntervalDays: 30,
    lightNeed: "full",
    tempRange: "16–27°C",
    wateredDaysAgo: 5,
    fertilizedDaysAgo: 20,
    history: [5, 12, 19, 26],
  },
  {
    nickname: "小薄荷",
    species: "薄荷",
    latinName: "Mentha spicata",
    location: "阳台右侧",
    illustrationUrl: "/plants/cell-1.png",
    waterIntervalDays: 2,
    fertilizeIntervalDays: 30,
    lightNeed: "indirect",
    tempRange: "15–25°C",
    wateredDaysAgo: 3,
    fertilizedDaysAgo: 9,
    history: [3, 5, 7, 9, 11, 13],
  },
  {
    nickname: "迷迭香",
    species: "迷迭香",
    latinName: "Salvia rosmarinus",
    location: "阳台右侧",
    illustrationUrl: "/plants/cell-6.png",
    waterIntervalDays: 5,
    fertilizeIntervalDays: 30,
    lightNeed: "full",
    tempRange: "10–26°C",
    wateredDaysAgo: 4,
    fertilizedDaysAgo: 18,
    history: [4, 9, 14, 19],
  },
  {
    nickname: "玉露",
    species: "玉露",
    latinName: "Haworthia cooperi",
    location: "书房",
    illustrationUrl: "/plants/cell-5.png",
    waterIntervalDays: 14,
    fertilizeIntervalDays: 30,
    lightNeed: "shade",
    tempRange: "12–24°C",
    wateredDaysAgo: 3,
    fertilizedDaysAgo: 26,
    history: [3, 17, 29],
  },
  {
    nickname: "绿萝瀑布",
    species: "绿萝",
    latinName: "Epipremnum aureum",
    location: "厨房",
    illustrationUrl: "/plants/cell-0.png",
    waterIntervalDays: 5,
    fertilizeIntervalDays: 30,
    lightNeed: "shade",
    tempRange: "16–28°C",
    wateredDaysAgo: 9,
    fertilizedDaysAgo: 24,
    history: [9, 14, 19, 24, 29],
  },
  {
    nickname: "红天竺葵",
    species: "天竺葵",
    latinName: "Pelargonium hortorum",
    location: "阳台左侧",
    illustrationUrl: "/plants/cell-2.png",
    waterIntervalDays: 3,
    fertilizeIntervalDays: 30,
    lightNeed: "full",
    tempRange: "13–24°C",
    wateredDaysAgo: 4,
    fertilizedDaysAgo: 6,
    history: [4, 7, 10, 13, 16],
  },
  {
    nickname: "柠檬树",
    species: "盆栽柠檬",
    latinName: "Citrus limon",
    location: "阳台左侧",
    illustrationUrl: "/plants/cell-7.png",
    waterIntervalDays: 4,
    fertilizeIntervalDays: 30,
    lightNeed: "full",
    tempRange: "15–30°C",
    wateredDaysAgo: 1,
    fertilizedDaysAgo: 15,
    history: [1, 5, 9, 13, 17, 21],
  },
];

export const SEED_COMPANIONS = [
  { id: "seed_mum", displayName: "妈妈", avatarColor: "#8e9b74" },
  { id: "seed_yu", displayName: "小雨", avatarColor: "#6c9ab5" },
];

export type SeedLog = {
  plantIndex: number;
  type: CareLogType;
  daysAgo: number;
  memberId: string;
  note?: string;
};

const NOTES: Record<number, string> = {
  0: "新叶开始裂开了，长得不错。",
  2: "薄荷叶子被剪掉一把，泡了茶。",
  5: "叶尖有点干，移到厨房更阴的位置。",
  6: "花开得很好，剪掉了两朵残花。",
};

/**
 * Builds roughly 40 journal entries over the past 30 days, spread across the
 * three family members, so the journal and the monthly summary have real content.
 */
export function buildSeedLogs(ownerId: string, mumId: string, yuId: string): SeedLog[] {
  const memberCycle = [ownerId, mumId, yuId, ownerId, yuId, mumId];
  const logs: SeedLog[] = [];
  SEED_PLANTS.forEach((plant, plantIndex) => {
    plant.history.forEach((daysAgo, index) => {
      logs.push({
        plantIndex,
        type: "water",
        daysAgo,
        memberId: memberCycle[(plantIndex + index) % memberCycle.length],
        note: index === 0 ? NOTES[plantIndex] : undefined,
      });
    });
    if (plant.fertilizedDaysAgo !== null) {
      logs.push({
        plantIndex,
        type: "fertilize",
        daysAgo: plant.fertilizedDaysAgo,
        memberId: memberCycle[(plantIndex + 2) % memberCycle.length],
      });
    }
    if (plantIndex % 3 === 1) {
      logs.push({
        plantIndex,
        type: "prune",
        daysAgo: plant.history[2] ?? 18,
        memberId: mumId,
      });
    }
    if (plantIndex === 5) {
      logs.push({ plantIndex, type: "repot", daysAgo: 21, memberId: ownerId });
    }
  });
  return logs;
}
