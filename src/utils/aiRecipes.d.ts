import {
  AllergyKey,
  DietType,
  Ingredient,
  MealType,
  Recipe,
  RecipeMatch,
} from '../types/cook';

export const MAX_AI_RECIPES: number;
export const AI_TIMEOUT_MS: number;
export const AI_DISCLAIMER_TEXT: string;

export interface AiPromptInput {
  selectedIngredientIds?: string[];
  diet?: DietType;
  mealType?: MealType;
  allergies?: AllergyKey[];
  adultsCount?: number;
  childrenCount?: number;
  ingredientsList?: Ingredient[];
}

export interface AiFilterContext {
  diet?: DietType;
  mealType?: MealType;
  allergies?: AllergyKey[];
  availableIngredientIds?: string[];
  existingRecipeNames?: string[];
}

export function buildPrompt(input?: AiPromptInput): string;

export function parseAiRecipes(
  text: unknown
): { ok: true; recipes: unknown[] } | { ok: false; error: string };

export function validateAiRecipe(
  recipe: unknown,
  ingredients?: Ingredient[],
  allowedFilters?: AiFilterContext
): { valid: true; recipe: RecipeMatch } | { valid: false; reason: string };

export function dropInvalid(
  recipes: unknown[],
  ingredients?: Ingredient[],
  filters?: AiFilterContext
): RecipeMatch[];

export function matchSavedAiRecipes(
  savedAiRecipes: Recipe[],
  filters?: AiFilterContext
): RecipeMatch[];

export function mergeAiRecipesStore(
  existing?: Recipe[],
  newlyGenerated?: Recipe[]
): Recipe[];

export function checkAiAvailability(signal?: AbortSignal): Promise<boolean>;

export type GenerateRecipesErrorCode =
  | 'ABORTED'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'KEY_ERROR'
  | 'PARSE_ERROR'
  | 'NO_SAFE_RECIPES'
  | 'NETWORK'
  | 'UPSTREAM_ERROR';

export function generateRecipes(
  input: {
    selectedIngredientIds: string[];
    diet: DietType;
    mealType: MealType;
    allergies: AllergyKey[];
    adultsCount: number;
    childrenCount: number;
  },
  signal?: AbortSignal
): Promise<
  | { ok: true; recipes: RecipeMatch[] }
  | { ok: false; code: GenerateRecipesErrorCode; message: string }
>;

export interface RecipeSubstitution {
  ingredient: string;
  substitute: string;
  reason: string;
}

export interface RecipeTipsInput {
  recipeName: string;
  diet?: DietType;
  cuisine?: string;
  ingredientNames?: string[];
  stepTexts?: string[];
  allergies?: AllergyKey[];
}

export function buildRecipeTipsPrompt(input?: Partial<RecipeTipsInput>): string;

export function parseAiRecipeTips(raw: unknown):
  | {
      ok: true;
      proTips: string[];
      substitutions: RecipeSubstitution[];
    }
  | { ok: false; error: string };

export function generateRecipeTipsAndSubstitutions(
  input: RecipeTipsInput,
  signal?: AbortSignal
): Promise<
  | {
      ok: true;
      proTips: string[];
      substitutions: RecipeSubstitution[];
    }
  | { ok: false; code: GenerateRecipesErrorCode; message: string }
>;
