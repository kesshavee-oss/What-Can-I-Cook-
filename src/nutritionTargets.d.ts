import { AgeGroup, Household, Recipe } from './types/cook';

export const ADULT_NUTRITION_TARGETS: {
  protein: number;
  calcium: number;
  iron: number;
  ironFemale: number;
  ironMale: number;
  fiber: number;
};

export const CHILD_NUTRITION_TARGETS: Record<
  AgeGroup,
  {
    label: string;
    rank: number;
    protein: number;
    calcium: number;
    iron: number;
  }
>;

export const NUTRITION_MEDICAL_DISCLAIMER: string;
export const CHILD_GUIDANCE_DISCLAIMER: string;

export interface DayNutritionSummary {
  mealCount: number;
  countedMeals: number;
  totals: {
    protein: number | null;
    calcium: number | null;
    iron: number | null;
    fiber: number | null;
    calories: number | null;
  };
  targets: {
    protein: number;
    calcium: number;
    iron: number;
    ironFemale: number;
    ironMale: number;
    fiber: number;
  };
  percentages: {
    protein: number | null;
    calcium: number | null;
    iron: number | null;
    fiber: number | null;
  };
}

export interface ChildRecipeEvaluation {
  hasChildren: boolean;
  youngestAgeGroup: AgeGroup | null;
  youngestLabel: string | null;
  flags: string[];
  isChildFriendly: boolean;
}

export function computeDayNutritionSummary(
  dayMeals: Array<{ recipeId: string; servings?: number }>,
  recipeMap: Map<string, Recipe> | Record<string, Recipe>,
  ironReference?: 'female' | 'male'
): DayNutritionSummary;

export function evaluateRecipeForChildren(
  recipe: Recipe,
  household: Household | null
): ChildRecipeEvaluation;
