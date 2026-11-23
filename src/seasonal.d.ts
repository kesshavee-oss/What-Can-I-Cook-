export type SeasonId = 'winter' | 'summer' | 'monsoon';
export type FestivalId = 'diwali' | 'eid' | 'pongal';

export interface SeasonMeta {
  id: SeasonId;
  label: string;
  monthsHint: string;
}

export const SEASONS: Record<SeasonId, SeasonMeta>;
export const FESTIVALS: Array<{ id: FestivalId; label: string }>;
export const SEASONAL_RECIPE_IDS: Record<SeasonId, string[]>;
export const FESTIVAL_RECIPE_IDS: Record<FestivalId, string[]>;
export const FESTIVAL_HIGHLIGHT_DAYS: number;

export function getIndianSeason(date?: Date | string): SeasonMeta;
export function getActiveFestival(
  festivalSelection: { id?: string; selectedAt?: string } | null,
  now?: Date
): { active: boolean; id: FestivalId | null; label: string | null; daysLeft: number };
export function getSeasonalHighlights<T extends { id: string }>(
  recipes: T[],
  festivalSelection?: { id?: string; selectedAt?: string } | null,
  now?: Date
): {
  season: SeasonMeta;
  festival: { active: boolean; id: FestivalId | null; label: string | null; daysLeft: number };
  seasonSet: Set<string>;
  festivalSet: Set<string>;
  matchingSeasonal: T[];
  matchingFestival: T[];
};
