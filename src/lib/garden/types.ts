export type CareLogType = "water" | "fertilize" | "repot" | "prune" | "note";

export type LightNeed = "shade" | "indirect" | "full";

/** Leaf state follows `daysSinceWatering / waterIntervalDays`. */
export type LeafState = "fresh" | "normal" | "thirsty" | "wilted";

export type MemberDto = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
  joinedAt: string;
};

export type PlantDto = {
  id: string;
  nickname: string;
  species: string;
  latinName: string | null;
  location: string;
  photoUrl: string | null;
  illustrationUrl: string;
  waterIntervalDays: number;
  fertilizeIntervalDays: number;
  lastFertilizedAt: string | null;
  lightNeed: LightNeed;
  tempRange: string;
  lastWateredAt: string;
  lastWateredBy: string | null;
  createdAt: string;
  createdBy: string;
  sortOrder: number;
};

export type CareLogDto = {
  id: string;
  plantId: string;
  type: CareLogType;
  memberId: string;
  note: string | null;
  createdAt: string;
};

export type HouseholdDto = {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
};

/** Everything the balcony screens need, fetched in one round trip. */
export type GardenSnapshot = {
  household: HouseholdDto;
  members: MemberDto[];
  plants: PlantDto[];
  logs: CareLogDto[];
  me: MemberDto;
  version: string;
};

export type GardenActor = {
  member: MemberDto;
  household: HouseholdDto;
};
