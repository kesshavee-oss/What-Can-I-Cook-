import { CookedMeal, DietType, MealType, Recipe } from '../types/cook';

export interface MonthGridCell {
  date: Date;
  iso: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}

export interface WeekDayEntry {
  date: Date;
  iso: string;
  dayNumber: number;
  shortDay: string;
  fullLabel: string;
}

export interface PeriodSummary {
  totalMeals: number;
  vegCount: number;
  nonVegCount: number;
  avgProteinPerDay: number | null;
  mostCookedLabel: string;
}

export interface PastMealPreset {
  key: string;
  recipeId: string;
  recipeName: string;
  diet: DietType;
  mealType: MealType;
  servings: number;
  proteinPerServing: number | null;
  lastCookedDate: string;
  lastCookedTime: string;
  timesCooked: number;
  note: string;
  recipe: Recipe | null;
}

export function startOfMonth(date: Date): Date;
export function startOfWeekMonday(date: Date): Date;
export function addDays(date: Date, days: number): Date;
export function formatDate(date: Date): string;
export function parseLocalDate(isoDate: string): Date;
export function getMonthGrid(dateOrYear: Date | number, monthIndex?: number): MonthGridCell[];
export function getWeekDays(date: Date): WeekDayEntry[];
export function sortMealsByDateTime(meals: CookedMeal[]): CookedMeal[];
export function groupMealsByDate(meals: CookedMeal[]): Record<string, CookedMeal[]>;
export function formatRangeHeading(
  mode: 'month' | 'week' | 'day',
  cursorDate: Date,
  selectedDateIso: string
): string;
export function formatDayPanelTitle(isoDate: string): string;
export function computePeriodSummary(
  rangeMeals: CookedMeal[],
  recipeMap: Map<string, Recipe> | Record<string, Recipe>
): PeriodSummary;
export function buildPastMealPresets(
  cookedMeals: CookedMeal[],
  recipeMap: Map<string, Recipe> | Record<string, Recipe>,
  query?: string
): PastMealPreset[];
export function createQuickAddedMeal(params: {
  preset: PastMealPreset;
  date: string;
  time: string;
  mealType?: MealType;
  servings?: number;
  note?: string;
  id?: string;
}): CookedMeal;

