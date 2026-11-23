import { GroceryItem } from '../types/cook';
import { PriceMap } from './priceDefaults';

export interface ListCostLine {
  id: string;
  name: string;
  ingredientId: string;
  paise: number | null;
  checked: boolean;
}

export interface ListCostSummary {
  totalPaise: number;
  knownPaise: number;
  knownCount: number;
  unknownCount: number;
  checkedPaise: number;
  leftToBuyPaise: number;
  leftToBuyUnknownCount: number;
  lines: ListCostLine[];
}

export function normalizePriceUnit(unit: unknown): string;

export function parseGroceryQuantity(quantityText: unknown): {
  amount: number | null;
  unit: string;
};

export function getUnitConversionFactor(sourceUnit: string, targetUnit: string): number | null;

export function mergePricesWithDefaults(overrides?: PriceMap): PriceMap;

export function estimateItemCost(
  ingredientId: string,
  quantityBase: number,
  unitBase: string,
  prices?: PriceMap
): number | null;

export function estimateListCost(
  groceryList: GroceryItem[],
  prices?: PriceMap
): ListCostSummary;

export function estimatePlanCost(
  missingItems: GroceryItem[],
  prices?: PriceMap
): ListCostSummary;

export function formatInr(paise: number | null | undefined): string;

export function paiseToEditableRupees(paise: number): string;

export function validatePriceInput(
  rawValue: string
): { ok: true; paise: number } | { ok: false; error: string };

export interface WeeklyBudgetBucket {
  weekStartIso: string;
  weekEndIso: string;
  label: string;
  totalPaise: number;
  purchaseCount: number;
  itemCount: number;
}

export interface WeeklyBudgetHistorySummary {
  weeks: WeeklyBudgetBucket[];
  maxWeekPaise: number;
  weeklyAveragePaise: number | null;
  highestWeek: WeeklyBudgetBucket | null;
  totalRecordedCount: number;
}

export function aggregateWeeklyBudgetHistory(
  purchases: Array<{ id: string; date: string; totalPaise: number; itemCount: number }>,
  referenceDate?: Date | string,
  weeksCount?: number
): WeeklyBudgetHistorySummary;

