import { Recipe, RecipeVisual, RecipeVisualIcon } from '../types/cook';

export const VISUAL_PALETTE: {
  tomato: string;
  herbGreen: string;
  turmeric: string;
  cream: string;
  deepBrown: string;
};

export const VALID_VISUAL_ICONS: Set<RecipeVisualIcon>;

export function isEggRecipe(recipe?: Partial<Recipe> | null): boolean;
export function pickIconForRecipe(recipe?: Partial<Recipe> | null): RecipeVisualIcon;
export function getVisualForRecipe(recipe?: Partial<Recipe> | null): RecipeVisual;
