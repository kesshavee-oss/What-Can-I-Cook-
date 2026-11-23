import { RECIPES, scaleServings, totalNutrition } from '../recipes.js';
import {
  AgeGroup,
  Household,
  NutritionInfo,
  Recipe,
  TotalNutritionResult,
} from '../types/cook';

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  toddler: 'Toddler (1-3)',
  child: 'Child (4-12)',
  teen: 'Teen (13-18)',
};

export type MacroKey = 'protein' | 'carbs' | 'fat' | 'fiber';

export interface MacroSpec {
  key: MacroKey;
  label: string;
  color: string;
  dailyTargetGrams: number;
  kcalPerGram: number;
}

export const MACRO_SPECS: MacroSpec[] = [
  {
    key: 'protein',
    label: 'Protein',
    color: '#1F6E42',
    dailyTargetGrams: 50,
    kcalPerGram: 4,
  },
  {
    key: 'carbs',
    label: 'Carbs',
    color: '#C5411B',
    dailyTargetGrams: 275,
    kcalPerGram: 4,
  },
  {
    key: 'fat',
    label: 'Fats',
    color: '#B45309',
    dailyTargetGrams: 70,
    kcalPerGram: 9,
  },
  {
    key: 'fiber',
    label: 'Fiber',
    color: '#5B2E91',
    dailyTargetGrams: 28,
    kcalPerGram: 0,
  },
];

export interface MacroBreakdownEntry extends MacroSpec {
  grams: number | null;
  kcal: number;
  pctDaily: number | null;
  energyPct: number | null;
}

export interface MacroBreakdownSummary {
  calories: number | null;
  entries: MacroBreakdownEntry[];
  hasAnyMacro: boolean;
  axisMax: number;
  totalMacroKcal: number;
}

function isValidFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val);
}

function computeNiceAxisMax(maxValue: number): number {
  if (maxValue <= 0) return 20;
  if (maxValue <= 10) return Math.ceil(maxValue / 2) * 2;
  if (maxValue <= 40) return Math.ceil(maxValue / 5) * 5;
  if (maxValue <= 100) return Math.ceil(maxValue / 10) * 10;
  return Math.ceil(maxValue / 25) * 25;
}

/**
 * Compute total household serving multiplier using scaleServings from recipes.js.
 */
export function calculateHouseholdServings(household: Household): number {
  const referenceRecipe = RECIPES[0] ?? { baseServings: 2, ingredients: [] };
  return scaleServings(referenceRecipe, household).householdMultiplier;
}

export function formatServingsLabel(servings: number): string {
  if (typeof servings !== 'number' || Number.isNaN(servings)) return '-';
  return Number.isInteger(servings)
    ? `${servings}`
    : servings.toFixed(2).replace(/0$/, '');
}

/**
 * Derive macronutrient & fiber breakdown for bar chart visualizations using
 * totalNutrition outputs (perPerson, householdTotal, householdMultiplier).
 */
export function computeMacroBreakdown(
  nutrition: TotalNutritionResult,
  scope: 'perPerson' | 'household'
): MacroBreakdownSummary {
  const { perPerson, householdTotal, householdMultiplier } = nutrition;
  const activeData: NutritionInfo =
    scope === 'perPerson' ? perPerson : householdTotal;
  const multiplier = scope === 'perPerson' ? 1 : Math.max(1, householdMultiplier);

  const rawEntries = MACRO_SPECS.map((spec) => {
    const rawPer = perPerson?.[spec.key];
    const rawActive = activeData?.[spec.key];
    // totalNutrition coerces null to 0; preserve null when perPerson is missing
    const valid = isValidFiniteNumber(rawPer) && isValidFiniteNumber(rawActive);
    const grams = valid ? Math.max(0, rawActive) : null;
    const kcal = grams !== null ? grams * spec.kcalPerGram : 0;
    const scaledTarget = spec.dailyTargetGrams * multiplier;
    const pctDaily =
      grams !== null && scaledTarget > 0
        ? Math.round((grams / scaledTarget) * 100)
        : null;

    return {
      ...spec,
      grams,
      kcal,
      pctDaily,
    };
  });

  const validEntries = rawEntries.filter((e) => e.grams !== null);
  const maxGrams = validEntries.reduce(
    (max, e) => Math.max(max, e.grams ?? 0),
    0
  );
  const totalMacroKcal = rawEntries.reduce((sum, e) => sum + e.kcal, 0);

  const entries: MacroBreakdownEntry[] = rawEntries.map((entry) => ({
    ...entry,
    energyPct:
      entry.kcalPerGram > 0 && totalMacroKcal > 0 && entry.grams !== null
        ? Math.round((entry.kcal / totalMacroKcal) * 100)
        : null,
  }));

  const calories =
    isValidFiniteNumber(perPerson?.calories) &&
    isValidFiniteNumber(activeData?.calories)
      ? activeData.calories
      : null;

  return {
    calories,
    entries,
    hasAnyMacro: validEntries.length > 0,
    axisMax: computeNiceAxisMax(maxGrams),
    totalMacroKcal,
  };
}

/**
 * Convenience helper to compute macro breakdown directly from a Recipe and Household.
 */
export function getRecipeMacroBreakdown(
  recipe: Recipe,
  household: Household,
  scope: 'perPerson' | 'household' = 'perPerson'
): MacroBreakdownSummary {
  return computeMacroBreakdown(totalNutrition(recipe, household), scope);
}
