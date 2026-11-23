import { GroceryItem, IngredientCategory, Recipe, RecipeVisual, ScaledIngredient } from '../types/cook';

export function buildShareRecipeText(
  recipe: Recipe,
  scaledIngredients?: Array<ScaledIngredient & { displayAmountText?: string; displayUnit?: string }>,
  servingsLabel?: number | string
): string;

export function renderRecipeShareCanvas(
  recipe: Recipe,
  scaledIngredients?: Array<ScaledIngredient & { displayAmountText?: string; displayUnit?: string }>,
  visual?: Partial<RecipeVisual>
): Promise<Blob>;

export const MAX_SHARED_ITEMS: number;
export const MAX_SHARED_PAYLOAD_BYTES: number;
export const SHARED_LIST_TOO_LONG_ERROR: string;
export const SHARED_LIST_OPEN_ERROR: string;

export interface SharedGroceryItem {
  id: string;
  name: string;
  category: IngredientCategory;
  quantityText: string;
  checked: boolean;
}

export function encodeSharedGroceryList(
  items: Array<Partial<GroceryItem>>
): {
  ok: boolean;
  encoded: string;
  error: string | null;
  itemCount?: number;
  byteLength?: number;
};

export function buildShareGroceryUrl(
  items: Array<Partial<GroceryItem>>,
  baseHref?: string
): {
  ok: boolean;
  url: string;
  error: string | null;
  itemCount?: number;
};

export function isSharedGroceryHash(hashStr: string): boolean;

export function decodeSharedGroceryFragment(hashOrFragment: string): {
  ok: boolean;
  error: string | null;
  items: SharedGroceryItem[];
};

export function generateSharedGroceryQrDataUrl(shareUrl: string): Promise<{
  ok: boolean;
  dataUrl: string;
  error: string | null;
}>;

export function buildShareGroceryMailtoUrl(
  items: Array<Partial<GroceryItem>>,
  options?: {
    sortBy?: string;
    selectedCategory?: string;
    categoryOrder?: string[];
  }
): {
  ok: boolean;
  mailtoUrl: string;
  error: string | null;
};

