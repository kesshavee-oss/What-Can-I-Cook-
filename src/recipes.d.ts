import {
  AllergyKey,
  DietType,
  Household,
  Ingredient,
  IngredientVisual,
  MealType,
  Recipe,
  RecipeMatch,
  RecipeVisual,
  ScaledServingsResult,
  TotalNutritionResult,
} from './types/cook';

export const INGREDIENTS: Ingredient[];
export const INGREDIENT_VISUALS: Record<string, IngredientVisual>;
export const RECIPES: Recipe[];
export const RECIPE_VISUALS: Record<string, RecipeVisual>;

export function getIngredientById(id: string): Ingredient | null;

export function evaluateRecipeMatch(
  recipe: Recipe,
  ownedMainSet: Set<string>,
  options?: { diet?: DietType; allergySet?: Set<AllergyKey> }
): (RecipeMatch & { hasSelectedMainMatch: boolean }) | null;

export function compareRecipeMatches(a: RecipeMatch, b: RecipeMatch): number;

export function diversifyMatchedRecipes(
  sortedRecipes: RecipeMatch[],
  maxPerSet?: number
): RecipeMatch[];

export function shuffleEqualScoringRecipes(
  recipes: RecipeMatch[]
): RecipeMatch[];

export function getRecipesForFilters(filters?: {
  diet?: DietType;
  mealType?: MealType;
  allergies?: AllergyKey[];
  availableIngredientIds?: string[];
}): RecipeMatch[];

export function scaleServings(
  recipe: Recipe,
  household?: Partial<Household>
): ScaledServingsResult;

export function totalNutrition(
  recipe: Recipe,
  household?: Partial<Household>
): TotalNutritionResult;
