import { addDays, dayDiff, startOfDay, toDateKey } from "./date";
import type { CareLogDto, LeafState, PlantDto } from "./types";

export const PLANT_IMAGE_PLACEHOLDER = "/plants/cell-4.png";

export function daysSinceWatering(plant: PlantDto, now: Date = new Date()): number {
  return Math.max(0, dayDiff(plant.lastWateredAt, now));
}

export function wateringRatio(plant: PlantDto, now: Date = new Date()): number {
  const interval = Math.max(1, plant.waterIntervalDays);
  return daysSinceWatering(plant, now) / interval;
}

export function leafStateFor(plant: PlantDto, now: Date = new Date()): LeafState {
  const ratio = wateringRatio(plant, now);
  if (ratio < 0.5) return "fresh";
  if (ratio < 1) return "normal";
  if (ratio < 1.5) return "thirsty";
  return "wilted";
}

export function needsWater(plant: PlantDto, now: Date = new Date()): boolean {
  return daysSinceWatering(plant, now) >= Math.max(1, plant.waterIntervalDays);
}

export function daysUntilNextWater(plant: PlantDto, now: Date = new Date()): number {
  return Math.max(1, plant.waterIntervalDays) - daysSinceWatering(plant, now);
}

/** Plants that need water float to the front; the rest follow by urgency. */
export function sortPlantsForHome(plants: PlantDto[], now: Date = new Date()): PlantDto[] {
  return [...plants].sort((a, b) => {
    const aNeeds = needsWater(a, now) ? 0 : 1;
    const bNeeds = needsWater(b, now) ? 0 : 1;
    if (aNeeds !== bNeeds) return aNeeds - bNeeds;
    const byUrgency = daysUntilNextWater(a, now) - daysUntilNextWater(b, now);
    if (byUrgency !== 0) return byUrgency;
    return a.nickname.localeCompare(b.nickname, "zh-Hans-CN");
  });
}

export type DayTaskKind = "done" | "planned" | "missed";
export type DayTaskType = "water" | "fertilize";

export type DayTask = {
  id: string;
  plantId: string;
  type: DayTaskType;
  kind: DayTaskKind;
  dateKey: string;
  memberId?: string;
  at?: string;
  delayedDays?: number;
};

export type DayPlan = {
  dateKey: string;
  date: Date;
  offsetFromToday: number;
  state: "past" | "today" | "future";
  tasks: DayTask[];
  doneCount: number;
  totalCount: number;
};

const PAST_WINDOW_DAYS = 30;
const FUTURE_WINDOW_DAYS = 30;

function anchorFor(plant: PlantDto, type: DayTaskType): Date {
  const value = type === "water" ? plant.lastWateredAt : plant.lastFertilizedAt;
  return startOfDay(value ?? plant.createdAt);
}

function intervalFor(plant: PlantDto, type: DayTaskType): number {
  const value =
    type === "water" ? plant.waterIntervalDays : plant.fertilizeIntervalDays;
  return Math.max(1, value);
}

export function buildSchedule(
  plants: PlantDto[],
  logs: CareLogDto[],
  today: Date = new Date(),
): Map<string, DayTask[]> {
  const byDate = new Map<string, DayTask[]>();
  const push = (task: DayTask) => {
    const list = byDate.get(task.dateKey);
    if (list) list.push(task);
    else byDate.set(task.dateKey, [task]);
  };
  const todayKey = toDateKey(today);
  const oldest = addDays(today, -PAST_WINDOW_DAYS);
  const horizon = addDays(today, FUTURE_WINDOW_DAYS);

  for (const plant of plants) {
    for (const type of ["water", "fertilize"] as DayTaskType[]) {
      const interval = intervalFor(plant, type);
      const history = logs
        .filter((log) => log.plantId === plant.id && log.type === type)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

      // 1. Recorded care: every entry inside the window lands on its own day,
      // so watering today shows up as a finished card today.
      for (const log of history) {
        const at = startOfDay(log.createdAt);
        if (+at < +oldest || +at > +horizon) continue;
        push({
          id: log.id,
          plantId: plant.id,
          type,
          kind: "done",
          dateKey: toDateKey(log.createdAt),
          memberId: log.memberId,
          at: log.createdAt,
        });
      }

      // 2. The rolling plan continues from the most recent recorded care (or
      // the plant's own anchor when there is no history yet).
      const lastLog = history.length
        ? startOfDay(history[history.length - 1].createdAt)
        : null;
      let due = addDays(anchorFor(plant, type), interval);
      if (lastLog && +addDays(lastLog, interval) > +due) {
        due = addDays(lastLog, interval);
      }
      let guard = 0;

      while (+due <= +horizon && guard < 240) {
        guard += 1;
        if (+due < +startOfDay(today)) {
          if (dayDiff(due, today) <= PAST_WINDOW_DAYS) {
            push({
              id: `missed-${plant.id}-${type}-${toDateKey(due)}`,
              plantId: plant.id,
              type,
              kind: "missed",
              dateKey: toDateKey(due),
            });
            push({
              id: `delayed-${plant.id}-${type}-${todayKey}`,
              plantId: plant.id,
              type,
              kind: "planned",
              dateKey: todayKey,
              delayedDays: dayDiff(due, today),
            });
          }
          due = addDays(today, interval);
          continue;
        }
        push({
          id: `planned-${plant.id}-${type}-${toDateKey(due)}`,
          plantId: plant.id,
          type,
          kind: "planned",
          dateKey: toDateKey(due),
        });
        due = addDays(due, interval);
      }
    }
  }

  for (const tasks of byDate.values()) {
    tasks.sort((a, b) => a.type.localeCompare(b.type));
  }
  return byDate;
}

export function plannedWaterDays(todayKey: string, schedule: Map<string, DayTask[]>) {
  return [...schedule.keys()]
    .filter((key) => key >= todayKey)
    .sort()
    .length;
}

export function buildDayPlans(
  plants: PlantDto[],
  logs: CareLogDto[],
  today: Date = new Date(),
): DayPlan[] {
  const schedule = buildSchedule(plants, logs, today);
  const plans: DayPlan[] = [];
  for (const offset of [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const date = addDays(today, offset);
    const dateKey = toDateKey(date);
    const tasks = schedule.get(dateKey) ?? [];
    const totalCount = tasks.length;
    const doneCount = tasks.filter((task) => task.kind === "done").length;
    plans.push({
      dateKey,
      date,
      offsetFromToday: offset,
      state: offset === 0 ? "today" : offset < 0 ? "past" : "future",
      tasks,
      doneCount,
      totalCount,
    });
  }
  return plans;
}

export function nextCareFor(plant: PlantDto) {
  const due = addDays(plant.lastWateredAt, Math.max(1, plant.waterIntervalDays));
  return due;
}
