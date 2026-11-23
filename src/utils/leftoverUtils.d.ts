import { LeftoverItem } from '../types/cook';

export interface ActiveLeftoverView extends LeftoverItem {
  isPastKeepUntil: boolean;
  isExpiringWithinOneDay: boolean;
}

export function addDaysToIso(dateIso: string, days: number): string;

export function createLeftoverRecord(params: {
  id?: string;
  recipeId: string;
  portions: number;
  maxServings?: number;
  cookedDate?: string;
  keepUntil?: string;
}): LeftoverItem | null;

export function eatLeftoverPortion(
  list: LeftoverItem[],
  leftoverId: string
): LeftoverItem[];

export function markLeftoverUsedUp(
  list: LeftoverItem[],
  leftoverId: string
): LeftoverItem[];

export function sortActiveLeftovers(
  list: LeftoverItem[],
  todayIso?: string
): ActiveLeftoverView[];
