import { AllergyKey, DietType, Recipe, RecipeMatch } from '../types/cook';

export type RecipeSortOption = 'best_match' | 'quickest' | 'least_missing';

export const RECIPE_SORT_OPTIONS: { id: RecipeSortOption; label: string }[];

export function sortRecipes(
  recipes: RecipeMatch[],
  sortBy?: RecipeSortOption
): RecipeMatch[];

export function recipeMatchesQuery(
  recipe: Partial<Recipe> | null | undefined,
  query: string
): boolean;

export function filterAvailableRecipes(params?: {
  recipes?: Recipe[];
  diet?: DietType;
  allergies?: AllergyKey[];
  availableIngredientIds?: string[];
  query?: string;
  sortBy?: RecipeSortOption;
}): RecipeMatch[];
