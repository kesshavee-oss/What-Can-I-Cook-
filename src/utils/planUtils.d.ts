import {
  GroceryItem,
  Household,
  MealType,
  PlannedMeal,
  PlannedMealStatus,
  Recipe,
} from '../types/cook';

export const MAX_RECIPES_PER_SLOT: number;
export const PLAN_MEAL_TYPES: MealType[];

export function getPlanWeekDays(anchorDate: Date | string): {
  date: Date;
  iso: string;
  dayNumber: number;
  shortDay: string;
  fullLabel: string;
}[];

export function getSlotMeals(
  plannedMeals: PlannedMeal[],
  dateIso: string,
  mealType: MealType
): PlannedMeal[];

export function canAddToSlot(
  plannedMeals: PlannedMeal[],
  dateIso: string,
  mealType: MealType
): boolean;

export function addPlannedMeal(
  plannedMeals: PlannedMeal[],
  input: {
    date: string;
    mealType: MealType;
    recipeId: string;
    servings: number;
    note?: string;
  }
): { nextList: PlannedMeal[]; error: string | null; added: PlannedMeal | null };

export function updatePlannedMealStatus(
  plannedMeals: PlannedMeal[],
  planId: string,
  status: PlannedMealStatus
): PlannedMeal[];

export function removePlannedMeal(
  plannedMeals: PlannedMeal[],
  planId: string
): PlannedMeal[];

export function copyLastWeek(
  plannedMeals: PlannedMeal[],
  targetMondayIso: string
): {
  nextList: PlannedMeal[];
  copiedCount: number;
  skippedCount: number;
  sourceCount: number;
};

export function computeWeekSummary(
  plannedMeals: PlannedMeal[],
  weekDateIsos: string[],
  recipeMap: Map<string, Recipe>
): {
  totalCount: number;
  pendingCount: number;
  cookedCount: number;
  skippedCount: number;
  vegCount: number;
  nonVegCount: number;
};

export interface WeekNutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function computeWeekNutritionSummary(
  plannedMeals: PlannedMeal[],
  weekDateIsos: string[],
  recipeMap: Map<string, Recipe>
): {
  activeMealCount: number;
  countedNutritionMeals: number;
  missingNutritionMeals: number;
  household: WeekNutritionTotals;
  perServing: WeekNutritionTotals;
};

export function addWeekMissingToGrocery(
  groceryList: GroceryItem[],
  plannedMeals: PlannedMeal[],
  weekDateIsos: string[],
  recipeMap: Map<string, Recipe>,
  household: Household,
  ownedIngredientIds?: string[]
): { nextGroceryList: GroceryItem[]; addedCount: number };

export function isPastPlannedReminder(
  meal: Pick<PlannedMeal, 'date' | 'status'>,
  todayIso: string
): boolean;

export interface AutoPlanProposal extends PlannedMeal {
  recipeName: string;
  diet: 'veg' | 'nonveg';
  protein: number;
}

export function generateAutoPlanWeek(params?: {
  weekDateIsos?: string[];
  existingPlannedMeals?: PlannedMeal[];
  recipes?: Recipe[];
  diet?: 'veg' | 'nonveg';
  allergies?: string[];
  ownedIngredientIds?: string[];
  emptySlotsOnly?: boolean;
  dietMix?: 'balanced' | 'veg_only';
  servings?: number;
  mealTypes?: MealType[];
}): {
  proposals: AutoPlanProposal[];
  nextList: PlannedMeal[];
  addedCount: number;
};

export interface PrintableWeekSlotItem {
  id: string;
  recipeId: string;
  name: string;
  diet: 'veg' | 'nonveg';
  totalMinutes: number | null;
  servingsText: string;
  status: PlannedMealStatus;
  isCooked: boolean;
  isSkipped: boolean;
  note: string;
}

export interface PrintableWeekDay {
  iso: string;
  shortDay: string;
  dayNumber: number;
  fullLabel: string;
  slots: Record<MealType, PrintableWeekSlotItem[]>;
}

export function buildPrintableWeekSchedule(params?: {
  plannedMeals?: PlannedMeal[];
  weekDays?: Array<{
    date: Date;
    iso: string;
    dayNumber: number;
    shortDay: string;
    fullLabel: string;
  }>;
  recipeMap?: Map<string, Recipe> | Record<string, Recipe>;
  includeSkipped?: boolean;
}): {
  days: PrintableWeekDay[];
  totalMealCount: number;
  cookedCount: number;
};

export interface WeeklyNutritionGoalEvaluation {
  status: 'empty' | 'below' | 'in_range' | 'above';
  actualCalories: number;
  minCalories: number;
  maxCalories: number;
  calorieBarPct: number;
  targetMinPct: number;
  remainingToMin: number;
  overMax: number;
  proteinGoalGrams: number | null;
  actualProtein: number | null;
  proteinBarPct: number | null;
  proteinRawPct: number | null;
}

export function evaluateWeeklyNutritionGoal(
  actualCalories: number,
  goal: {
    minCalories: number;
    maxCalories: number;
    proteinGrams?: number | null;
  } | null | undefined,
  actualProtein?: number | null
): WeeklyNutritionGoalEvaluation | null;



