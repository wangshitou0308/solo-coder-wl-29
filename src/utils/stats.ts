import type {
  BirdSpecies,
  BirdingJournal,
  BirdObservation,
  UserSpeciesRecord,
  BirdFamily,
  BirdGenus,
  BirdOrder,
  HabitatType,
  ResidenceType,
} from "@/types";
import {
  HabitatTypeLabels, ResidenceTypeLabels } from "@/types";
import {
  getMonthKey, getYearKey, getCurrentYear, formatDate } from "./date";

export interface ObservationWithJournal extends BirdObservation {
  journal?: BirdingJournal;
}

export interface SpeciesWithRecord {
  species: BirdSpecies;
  record?: UserSpeciesRecord;
}

export interface MonthlyStats {
  month: string;
  monthKey: string;
  观察次数: number;
  新鸟种: number;
  lifeListNew: number;
  观鸟时长: number;
  观察记录数: number;
}

export interface LocationStats {
  location: string;
  journalCount: number;
  speciesCount: number;
  observationCount: number;
  totalMinutes: number;
}

export interface TopSpecies {
  species: BirdSpecies;
  observationCount: number;
  totalCount: number;
}

export interface TopFamily {
  family: BirdFamily;
  speciesCount: number;
  observationCount: number;
}

export interface TopGenus {
  genus: BirdGenus;
  speciesCount: number;
  observationCount: number;
}

export interface TimeOfDayStats {
  period: string;
  count: number;
  label: string;
}

export interface WeekdayStats {
  weekday: number;
  count: number;
  label: string;
}

export interface SeasonStats {
  season: string;
  count: number;
  speciesCount: number;
  label: string;
}

export interface RecommendedBird {
  species: BirdSpecies;
  reason: string;
  reasonType: "common_unobserved" | "seasonal" | "same_habitat";
}

export interface TaxonomyStats {
  orderCount: number;
  familyCount: number;
  genusCount: number;
  speciesCount: number;
}

export interface SpeciesLocationRecord {
  location: string;
  count: number;
  lastSeen: string;
}

export interface SpeciesDetailStats {
  firstObservedAt: string | null;
  firstLocation: string | null;
  lastObservedAt: string | null;
  lastLocation: string | null;
  totalObservations: number;
  totalIndividuals: number;
  locations: SpeciesLocationRecord[];
}

export interface ImportSummary {
  journalCount: number;
  observationCount: number;
  equipmentCount: number;
  wishlistCount: number;
  speciesRecordCount: number;
}

export interface CompleteStats {
  taxonomy: TaxonomyStats;
  monthly: MonthlyStats[];
  location: LocationStats[];
  topSpecies: TopSpecies[];
  topFamilies: TopFamily[];
  topGenera: TopGenus[];
  rareRecords: TopSpecies[];
  timeOfDay: TimeOfDayStats[];
  weekday: WeekdayStats[];
  season: SeasonStats[];
  recommendedBirds: RecommendedBird[];
  totalJournals: number;
  totalMinutes: number;
  totalObservations: number;
  yearSpeciesCount: number;
  yearJournalsCount: number;
  yearObservationsCount: number;
  yearMinutes: number;
}

export interface PdfReportData {
  year: number;
  summary: {
    totalJournals: number;
    totalHours: number;
    totalSpecies: number;
    totalObservations: number;
    newSpecies: number;
    topLocation: string;
    topSpecies: TopSpecies | null;
  };
  firstObservations: { species: BirdSpecies; date: string; location: string }[];
  locationRankings: LocationStats[];
  monthlyTrend: MonthlyStats[];
  representativeRecords: { journal: BirdingJournal; species: BirdSpecies[]; observationCount: number }[];
  allSpecies: { species: BirdSpecies; count: number }[];
  habitatDistribution: { name: string; value: number }[];
  residenceDistribution: { name: string; value: number }[];
}

export function getTaxonomyStats(
  allSpecies: BirdSpecies[],
  allFamilies: BirdFamily[],
  allGenera: BirdGenus[],
  userRecords: UserSpeciesRecord[]
): TaxonomyStats {
  const observedSpeciesIds = new Set(userRecords.map((r) => r.species_id));
  const observedSpecies = allSpecies.filter((s) => observedSpeciesIds.has(s.id));

  const genusMap = new Map(allGenera.map((g) => [g.id, g]));
  const familyMap = new Map(allFamilies.map((f) => [f.id, f]));

  const genusIds = new Set<string>();
  const familyIds = new Set<string>();
  const orderIds = new Set<string>();

  for (const sp of observedSpecies) {
    const genus = genusMap.get(sp.genus_id);
    if (genus) {
      genusIds.add(genus.id);
      const family = familyMap.get(genus.family_id);
      if (family) {
        familyIds.add(family.id);
        orderIds.add(family.order_id);
      }
    }
  }

  return {
    orderCount: orderIds.size,
    familyCount: familyIds.size,
    genusCount: genusIds.size,
    speciesCount: observedSpecies.length,
  };
}

export function buildTaxonomyMaps(
  allSpecies: BirdSpecies[],
  allFamilies: BirdFamily[],
  allGenera: BirdGenus[]
) {
  const genusMap = new Map(allGenera.map((g) => [g.id, g]));
  const familyMap = new Map(allFamilies.map((f) => [f.id, f]));

  const speciesToGenus = new Map<string, BirdGenus>();
  const speciesToFamily = new Map<string, BirdFamily>();
  const speciesToOrder = new Map<string, BirdOrder>();

  const speciesByGenus = new Map<string, BirdSpecies[]>();
  const speciesByFamily = new Map<string, BirdSpecies[]>();
  const speciesByOrder = new Map<string, BirdSpecies[]>();

  const orderMap = new Map<string, BirdOrder>();

  for (const sp of allSpecies) {
    const genus = genusMap.get(sp.genus_id);
    if (genus) {
      speciesToGenus.set(sp.id, genus);
      if (!speciesByGenus.has(genus.id)) speciesByGenus.set(genus.id, []);
      speciesByGenus.get(genus.id)!.push(sp);

      const family = familyMap.get(genus.family_id);
      if (family) {
        speciesToFamily.set(sp.id, family);
        if (!speciesByFamily.has(family.id)) speciesByFamily.set(family.id, []);
        speciesByFamily.get(family.id)!.push(sp);

        if (!orderMap.has(family.order_id)) {
          orderMap.set(family.order_id, { id: family.order_id, name_cn: "", name_latin: "" });
        }
        speciesToOrder.set(sp.id, orderMap.get(family.order_id)!);

        if (!speciesByOrder.has(family.order_id)) speciesByOrder.set(family.order_id, []);
        speciesByOrder.get(family.order_id)!.push(sp);
      }
    }
  }

  return {
    genusMap,
    familyMap,
    orderMap,
    speciesToGenus,
    speciesToFamily,
    speciesToOrder,
    speciesByGenus,
    speciesByFamily,
    speciesByOrder,
  };
}

export function getMonthlyStats(
  journals: BirdingJournal[],
  observations: BirdObservation[],
  userRecords: UserSpeciesRecord[],
  year: number
): MonthlyStats[] {
  const monthData: MonthlyStats[] = [];
  const journalMap = new Map(journals.map((j) => [j.id, j]));

  const yearJournals = journals.filter(
    (j) => new Date(j.start_time).getFullYear() === year
  );

  const yearObservations = observations.filter((o) => {
    const j = journalMap.get(o.journal_id);
    return j && new Date(j.start_time).getFullYear() === year;
  });

  for (let i = 1; i <= 12; i++) {
    const monthKey = `${year}-${String(i).padStart(2, "0")}`;
    const monthJournals = yearJournals.filter((j) => getMonthKey(j.start_time) === monthKey);
    const monthObs = yearObservations.filter((o) => {
      const j = journalMap.get(o.journal_id);
      return j && getMonthKey(j.start_time) === monthKey;
    });
    const monthSpeciesIds = new Set(monthObs.map((o) => o.species_id));

    let monthMinutes = 0;
    for (const j of monthJournals) {
      const dur = (new Date(j.end_time).getTime() - new Date(j.start_time).getTime()) / 60000;
      if (dur > 0) monthMinutes += dur;
    }

    let lifeListNew = 0;
    for (const r of userRecords) {
      if (r.first_observed_at.startsWith(monthKey)) {
        lifeListNew++;
      }
    }

    monthData.push({
      month: `${i}月`,
      monthKey,
      观察次数: monthJournals.length,
      新鸟种: monthSpeciesIds.size,
      lifeListNew,
      观鸟时长: Math.round((monthMinutes / 60) * 10) / 10,
      观察记录数: monthObs.length,
    });
  }

  return monthData;
}

export function getLocationStats(
  journals: BirdingJournal[],
  observations: BirdObservation[]
): LocationStats[] {
  const journalMap = new Map(journals.map((j) => [j.id, j]));
  const locationMap = new Map<string, {
    journalIds: Set<string>;
    speciesIds: Set<string>;
    observationCount: number;
    totalMinutes: number;
  }>();

  for (const j of journals) {
    const loc = j.location || "未命名地点";
    if (!locationMap.has(loc)) {
      locationMap.set(loc, {
        journalIds: new Set(),
        speciesIds: new Set(),
        observationCount: 0,
        totalMinutes: 0,
      });
    }
    const data = locationMap.get(loc)!;
    data.journalIds.add(j.id);
    const dur = (new Date(j.end_time).getTime() - new Date(j.start_time).getTime()) / 60000;
    if (dur > 0) data.totalMinutes += dur;
  }

  for (const o of observations) {
    const journal = journalMap.get(o.journal_id);
    if (!journal) continue;
    const loc = journal.location || "未命名地点";
    const data = locationMap.get(loc);
    if (data) {
      data.speciesIds.add(o.species_id);
      data.observationCount++;
    }
  }

  const result: LocationStats[] = [];
  for (const [location, data] of locationMap) {
    result.push({
      location,
      journalCount: data.journalIds.size,
      speciesCount: data.speciesIds.size,
      observationCount: data.observationCount,
      totalMinutes: Math.round(data.totalMinutes),
    });
  }

  return result.sort((a, b) => b.journalCount - a.journalCount);
}

export function getTopSpecies(
  allSpecies: BirdSpecies[],
  observations: BirdObservation[],
  _userRecords: UserSpeciesRecord[],
  limit = 10
): TopSpecies[] {
  const speciesObsCount = new Map<string, number>();
  const speciesTotalCount = new Map<string, number>();

  for (const o of observations) {
    speciesObsCount.set(o.species_id, (speciesObsCount.get(o.species_id) || 0) + 1);
    speciesTotalCount.set(o.species_id, (speciesTotalCount.get(o.species_id) || 0) + o.count);
  }

  const speciesMap = new Map(allSpecies.map((s) => [s.id, s]));
  const result: TopSpecies[] = [];
  for (const [spId, obsCount] of speciesObsCount) {
    const sp = speciesMap.get(spId);
    if (sp) {
      result.push({
        species: sp,
        observationCount: obsCount,
        totalCount: speciesTotalCount.get(spId) || 0,
      });
    }
  }

  return result.sort((a, b) => b.observationCount - a.observationCount).slice(0, limit);
}

export function getTopFamilies(
  allSpecies: BirdSpecies[],
  allFamilies: BirdFamily[],
  allGenera: BirdGenus[],
  observations: BirdObservation[],
  limit = 5
): TopFamily[] {
  const genusMap = new Map(allGenera.map((g) => [g.id, g]));
  const familyMap = new Map(allFamilies.map((f) => [f.id, f]));
  const speciesMap = new Map(allSpecies.map((s) => [s.id, s]));
  const familySpeciesCount = new Map<string, Set<string>>();
  const familyObsCount = new Map<string, number>();

  for (const o of observations) {
    const sp = speciesMap.get(o.species_id);
    if (!sp) continue;
    const genus = genusMap.get(sp.genus_id);
    if (!genus) continue;
    const family = familyMap.get(genus.family_id);
    if (!family) continue;

    if (!familySpeciesCount.has(family.id)) {
      familySpeciesCount.set(family.id, new Set());
    }
    familySpeciesCount.get(family.id)!.add(sp.id);
    familyObsCount.set(family.id, (familyObsCount.get(family.id) || 0) + 1);
  }

  const result: TopFamily[] = [];
  for (const family of allFamilies) {
    const speciesCount = familySpeciesCount.get(family.id)?.size || 0;
    if (speciesCount > 0) {
      result.push({
        family,
        speciesCount,
        observationCount: familyObsCount.get(family.id) || 0,
      });
    }
  }

  return result.sort((a, b) => b.speciesCount - a.speciesCount).slice(0, limit);
}

export function getTopGenera(
  allSpecies: BirdSpecies[],
  allGenera: BirdGenus[],
  observations: BirdObservation[],
  limit = 5
): TopGenus[] {
  const speciesMap = new Map(allSpecies.map((s) => [s.id, s]));
  const genusSpeciesCount = new Map<string, Set<string>>();
  const genusObsCount = new Map<string, number>();

  for (const o of observations) {
    const sp = speciesMap.get(o.species_id);
    if (!sp) continue;

    if (!genusSpeciesCount.has(sp.genus_id)) {
      genusSpeciesCount.set(sp.genus_id, new Set());
    }
    genusSpeciesCount.get(sp.genus_id)!.add(sp.id);
    genusObsCount.set(sp.genus_id, (genusObsCount.get(sp.genus_id) || 0) + 1);
  }

  const result: TopGenus[] = [];
  const genusMap = new Map(allGenera.map((g) => [g.id, g]));
  for (const [genusId, speciesSet] of genusSpeciesCount) {
    const genus = genusMap.get(genusId);
    if (genus) {
      result.push({
        genus,
        speciesCount: speciesSet.size,
        observationCount: genusObsCount.get(genusId) || 0,
      });
    }
  }

  return result.sort((a, b) => b.speciesCount - a.speciesCount).slice(0, limit);
}

export function getRareRecords(
  allSpecies: BirdSpecies[],
  observations: BirdObservation[],
  _userRecords: UserSpeciesRecord[],
  limit = 5
): TopSpecies[] {
  const speciesObsCount = new Map<string, number>();

  for (const o of observations) {
    speciesObsCount.set(o.species_id, (speciesObsCount.get(o.species_id) || 0) + 1);
  }

  const speciesMap = new Map(allSpecies.map((s) => [s.id, s]));
  const observedSpecies: { sp: BirdSpecies; count: number }[] = [];
  for (const [spId, count] of speciesObsCount) {
    const sp = speciesMap.get(spId);
    if (sp) observedSpecies.push({ sp, count });
  }

  const sorted = observedSpecies.sort((a, b) => a.count - b.count);

  return sorted.slice(0, limit).map(({ sp, count }) => ({
    species: sp,
    observationCount: count,
    totalCount: 0,
  }));
}

export function getTimeOfDayStats(
  journals: BirdingJournal[]
): TimeOfDayStats[] {
  const periods = [
    { key: "early_morning", label: "清晨 (5-8点)", start: 5, end: 8 },
    { key: "morning", label: "上午 (8-12点)", start: 8, end: 12 },
    { key: "afternoon", label: "下午 (12-17点)", start: 12, end: 17 },
    { key: "evening", label: "傍晚 (17-20点)", start: 17, end: 20 },
    { key: "night", label: "夜间 (20-5点)", start: 20, end: 5 },
  ];

  const result: TimeOfDayStats[] = [];

  for (const p of periods) {
    let count = 0;
    for (const j of journals) {
      const hour = new Date(j.start_time).getHours();
      if (p.start < p.end) {
        if (hour >= p.start && hour < p.end) count++;
      } else {
        if (hour >= p.start || hour < p.end) count++;
      }
    }
    result.push({
      period: p.key,
      count,
      label: p.label,
    });
  }

  return result;
}

export function getWeekdayStats(
  journals: BirdingJournal[]
): WeekdayStats[] {
  const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const result: WeekdayStats[] = [];

  for (let i = 0; i < 7; i++) {
    const count = journals.filter(
      (j) => new Date(j.start_time).getDay() === i
    ).length;
    result.push({
      weekday: i,
      count,
      label: weekdayNames[i],
    });
  }

  return result;
}

export function getSeasonStats(
  journals: BirdingJournal[],
  observations: BirdObservation[]
): SeasonStats[] {
  const seasons = [
    { key: "spring", label: "春季", months: [2, 3, 4] },
    { key: "summer", label: "夏季", months: [5, 6, 7] },
    { key: "autumn", label: "秋季", months: [8, 9, 10] },
    { key: "winter", label: "冬季", months: [11, 0, 1] },
  ];

  const journalMap = new Map(journals.map((j) => [j.id, j]));
  const result: SeasonStats[] = [];

  for (const s of seasons) {
    const seasonJournals = journals.filter((j) =>
      s.months.includes(new Date(j.start_time).getMonth())
    );
    const seasonObs = observations.filter((o) => {
      const j = journalMap.get(o.journal_id);
      return j && s.months.includes(new Date(j.start_time).getMonth());
    });
    const speciesIds = new Set(seasonObs.map((o) => o.species_id));

    result.push({
      season: s.key,
      count: seasonJournals.length,
      speciesCount: speciesIds.size,
      label: s.label,
    });
  }

  return result;
}

export function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export function getSeasonLabel(season: string): string {
  const map: Record<string, string> = {
    spring: "春季",
    summer: "夏季",
    autumn: "秋季",
    winter: "冬季",
  };
  return map[season] || season;
}

export function getRecommendedBirds(
  allSpecies: BirdSpecies[],
  userRecords: UserSpeciesRecord[],
  journals: BirdingJournal[],
  observations: BirdObservation[],
  limit = 6
): RecommendedBird[] {
  const observedIds = new Set(userRecords.map((r) => r.species_id));
  const unobserved = allSpecies.filter((s) => !observedIds.has(s.id));
  const recommendations: RecommendedBird[] = [];
  const usedIds = new Set<string>();

  const commonUnobserved = unobserved
    .filter((s) => s.is_common)
    .slice(0, Math.ceil(limit / 3))
    .map((s) => {
      usedIds.add(s.id);
      return {
        species: s,
        reason: "常见但未观察",
        reasonType: "common_unobserved" as const,
      };
    });
  recommendations.push(...commonUnobserved);

  const currentSeason = getCurrentSeason();
  const seasonalResidents: Record<string, ResidenceType[]> = {
    spring: ["summer_visitor", "passage_migrant"],
    summer: ["summer_visitor", "resident"],
    autumn: ["winter_visitor", "passage_migrant"],
    winter: ["winter_visitor", "resident"],
  };
  const seasonTypes = seasonalResidents[currentSeason] || [];
  const seasonalBirds = unobserved
    .filter((s) => !usedIds.has(s.id) && seasonTypes.includes(s.residence_type))
    .slice(0, Math.ceil(limit / 3))
    .map((s) => {
      usedIds.add(s.id);
      return {
        species: s,
        reason: `${getSeasonLabel(currentSeason)}相关鸟种`,
        reasonType: "seasonal" as const,
      };
    });
  recommendations.push(...seasonalBirds);

  if (journals.length > 0) {
    const recentJournals = journals.slice(0, Math.min(10, journals.length));
    const habitatCount = new Map<HabitatType, number>();
    for (const j of recentJournals) {
      habitatCount.set(j.habitat_type, (habitatCount.get(j.habitat_type) || 0) + 1);
    }
    const topHabitats = Array.from(habitatCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([h]) => h);

    const remaining = limit - recommendations.length;
    if (remaining > 0) {
      const sameHabitatBirds = unobserved
        .filter((s) => !usedIds.has(s.id) && topHabitats.includes(s.habitat_type))
        .slice(0, remaining)
        .map((s) => ({
          species: s,
          reason: `${HabitatTypeLabels[s.habitat_type]}常见鸟种`,
          reasonType: "same_habitat" as const,
        }));
      recommendations.push(...sameHabitatBirds);
    }
  }

  const remaining = limit - recommendations.length;
  if (remaining > 0) {
    const filler = unobserved
      .filter((s) => !usedIds.has(s.id))
      .slice(0, remaining)
      .map((s) => ({
        species: s,
        reason: "推荐观察",
        reasonType: "common_unobserved" as const,
      }));
    recommendations.push(...filler);
  }

  return recommendations.slice(0, limit);
}

export function getSpeciesDetailStats(
  speciesId: string,
  observations: BirdObservation[],
  journals: BirdingJournal[],
  userRecords: UserSpeciesRecord[]
): SpeciesDetailStats {
  const journalMap = new Map(journals.map((j) => [j.id, j]));
  const speciesObs = observations.filter((o) => o.species_id === speciesId);
  const userRecord = userRecords.find((r) => r.species_id === speciesId);

  if (speciesObs.length === 0) {
    return {
      firstObservedAt: null,
      firstLocation: null,
      lastObservedAt: null,
      lastLocation: null,
      totalObservations: 0,
      totalIndividuals: 0,
      locations: [],
    };
  }

  const obsWithJournals = speciesObs
    .map((o) => ({ obs: o, journal: journalMap.get(o.journal_id) }))
    .filter((x) => x.journal) as { obs: BirdObservation; journal: BirdingJournal }[];

  obsWithJournals.sort((a, b) =>
    new Date(a.journal.start_time).getTime() - new Date(b.journal.start_time).getTime()
  );

  const first = obsWithJournals[0];
  const last = obsWithJournals[obsWithJournals.length - 1];

  const locationMap = new Map<string, { count: number; lastSeen: string }>();
  for (const { obs, journal } of obsWithJournals) {
    const loc = journal.location || "未命名地点";
    const existing = locationMap.get(loc);
    if (!existing) {
      locationMap.set(loc, { count: 1, lastSeen: journal.start_time });
    } else {
      existing.count++;
      if (new Date(journal.start_time) > new Date(existing.lastSeen)) {
        existing.lastSeen = journal.start_time;
      }
    }
  }

  const locations: SpeciesLocationRecord[] = Array.from(locationMap.entries())
    .map(([location, data]) => ({
      location,
      count: data.count,
      lastSeen: data.lastSeen,
    }))
    .sort((a, b) => b.count - a.count);

  const totalIndividuals = speciesObs.reduce((sum, o) => sum + o.count, 0);

  return {
    firstObservedAt: userRecord?.first_observed_at || first.journal.start_time,
    firstLocation: userRecord?.first_location || first.journal.location,
    lastObservedAt: last.journal.start_time,
    lastLocation: last.journal.location,
    totalObservations: speciesObs.length,
    totalIndividuals,
    locations,
  };
}

export function getCompleteStats(
  allSpecies: BirdSpecies[],
  allFamilies: BirdFamily[],
  allGenera: BirdGenus[],
  userRecords: UserSpeciesRecord[],
  journals: BirdingJournal[],
  observations: BirdObservation[],
  year: number = getCurrentYear()
): CompleteStats {
  const taxonomy = getTaxonomyStats(allSpecies, allFamilies, allGenera, userRecords);
  const monthly = getMonthlyStats(journals, observations, userRecords, year);
  const location = getLocationStats(journals, observations);
  const topSpecies = getTopSpecies(allSpecies, observations, userRecords, 10);
  const topFamilies = getTopFamilies(allSpecies, allFamilies, allGenera, observations, 5);
  const topGenera = getTopGenera(allSpecies, allGenera, observations, 5);
  const rareRecords = getRareRecords(allSpecies, observations, userRecords, 5);
  const timeOfDay = getTimeOfDayStats(journals);
  const weekday = getWeekdayStats(journals);
  const season = getSeasonStats(journals, observations);
  const recommendedBirds = getRecommendedBirds(allSpecies, userRecords, journals, observations, 6);

  const totalMinutes = journals.reduce((sum, j) => {
    const dur = (new Date(j.end_time).getTime() - new Date(j.start_time).getTime()) / 60000;
    return sum + (dur > 0 ? dur : 0);
  }, 0);

  const yearJournals = journals.filter((j) => new Date(j.start_time).getFullYear() === year);
  const journalMap = new Map(journals.map((j) => [j.id, j]));
  const yearObservations = observations.filter((o) => {
    const j = journalMap.get(o.journal_id);
    return j && new Date(j.start_time).getFullYear() === year;
  });
  const yearSpeciesIds = new Set(yearObservations.map((o) => o.species_id));
  const yearMinutes = yearJournals.reduce((sum, j) => {
    const dur = (new Date(j.end_time).getTime() - new Date(j.start_time).getTime()) / 60000;
    return sum + (dur > 0 ? dur : 0);
  }, 0);

  return {
    taxonomy,
    monthly,
    location,
    topSpecies,
    topFamilies,
    topGenera,
    rareRecords,
    timeOfDay,
    weekday,
    season,
    recommendedBirds,
    totalJournals: journals.length,
    totalMinutes: Math.round(totalMinutes),
    totalObservations: observations.length,
    yearSpeciesCount: yearSpeciesIds.size,
    yearJournalsCount: yearJournals.length,
    yearObservationsCount: yearObservations.length,
    yearMinutes: Math.round(yearMinutes),
  };
}

export function getPdfReportData(
  year: number,
  allSpecies: BirdSpecies[],
  allFamilies: BirdFamily[],
  allGenera: BirdGenus[],
  userRecords: UserSpeciesRecord[],
  journals: BirdingJournal[],
  observations: BirdObservation[]
): PdfReportData {
  const stats = getCompleteStats(
    allSpecies,
    allFamilies,
    allGenera,
    userRecords,
    journals,
    observations,
    year
  );

  const journalMap = new Map(journals.map((j) => [j.id, j]));
  const speciesMap = new Map(allSpecies.map((s) => [s.id, s]));

  const yearJournals = journals.filter((j) => getYearKey(j.start_time) === String(year));
  const yearObs = observations.filter((o) => {
    const j = journalMap.get(o.journal_id);
    return j && getYearKey(j.start_time) === String(year);
  });

  const firstObservations = userRecords
    .filter((r) => getYearKey(r.first_observed_at) === String(year))
    .map((r) => {
      const species = speciesMap.get(r.species_id);
      return species ? {
        species,
        date: r.first_observed_at,
        location: r.first_location,
      } : null;
    })
    .filter((x): x is { species: BirdSpecies; date: string; location: string } => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const locationRankings = stats.location.sort((a, b) => b.journalCount - a.journalCount).slice(0, 10);

  const allSpeciesWithCount = Array.from(new Set(yearObs.map((o) => o.species_id)))
    .map((id) => {
      const species = speciesMap.get(id);
      const count = yearObs.filter((o) => o.species_id === id).reduce((sum, o) => sum + o.count, 0);
      return species ? { species, count } : null;
    })
    .filter((x): x is { species: BirdSpecies; count: number } => x !== null)
    .sort((a, b) => b.count - a.count);

  const habitatDistribution: { name: string; value: number }[] = [];
  const habitatCount: Record<string, number> = {};
  for (const { species } of allSpeciesWithCount) {
    const label = HabitatTypeLabels[species.habitat_type];
    habitatCount[label] = (habitatCount[label] || 0) + 1;
  }
  for (const [name, value] of Object.entries(habitatCount)) {
    habitatDistribution.push({ name, value });
  }

  const residenceDistribution: { name: string; value: number }[] = [];
  const residenceCount: Record<string, number> = {};
  for (const { species } of allSpeciesWithCount) {
    const label = ResidenceTypeLabels[species.residence_type];
    residenceCount[label] = (residenceCount[label] || 0) + 1;
  }
  for (const [name, value] of Object.entries(residenceCount)) {
    residenceDistribution.push({ name, value });
  }

  const representativeRecords = yearJournals
    .map((journal) => {
      const jObs = yearObs.filter((o) => o.journal_id === journal.id);
      const species = Array.from(new Set(jObs.map((o) => o.species_id)))
        .map((id) => speciesMap.get(id))
        .filter((s): s is BirdSpecies => !!s);
      return {
        journal,
        species,
        observationCount: jObs.length,
      };
    })
    .sort((a, b) => b.species.length - a.species.length)
    .slice(0, 5);

  const newSpecies = userRecords.filter(
    (r) => getYearKey(r.first_observed_at) === String(year)
  ).length;

  return {
    year,
    summary: {
      totalJournals: stats.yearJournalsCount,
      totalHours: Math.round((stats.yearMinutes / 60) * 10) / 10,
      totalSpecies: stats.yearSpeciesCount,
      totalObservations: stats.yearObservationsCount,
      newSpecies,
      topLocation: locationRankings[0]?.location || "-",
      topSpecies: stats.topSpecies[0] || null,
    },
    firstObservations,
    locationRankings,
    monthlyTrend: stats.monthly,
    representativeRecords,
    allSpecies: allSpeciesWithCount,
    habitatDistribution,
    residenceDistribution,
  };
}
