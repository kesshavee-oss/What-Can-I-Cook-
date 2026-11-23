export interface ExpiringSoonItem {
  ingredientId: string;
  name: string;
  boughtOn: string;
  expiryDate: string;
  daysRemaining: number;
  label: string;
}

export const SHELF_LIFE_DAYS: Record<string, number>;

export function getShelfLifeDays(ingredientId: string): number | null;
export function computeIngredientExpiryDate(
  ingredientId: string,
  boughtOnIso: string
): string | null;
export function getDaysRemaining(
  ingredientId: string,
  boughtOnIso: string,
  todayIso?: string
): number | null;
export function formatFreshnessLabel(daysRemaining: number | null): string;
export function getExpiringSoonItems(
  pantryEntries: Array<{ ingredientId: string; boughtOn: string }>,
  selectedIds: string[],
  withinDays?: number,
  todayIso?: string
): ExpiringSoonItem[];
