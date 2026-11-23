import { GroceryItem, Household, IngredientCategory, Recipe } from '../types/cook';

export type GrocerySortMode =
  | 'aisle'
  | 'checked_last'
  | 'category_az'
  | 'category_count'
  | 'name_az'
  | 'added_order';

export const GROCERY_CATEGORIES: { id: IngredientCategory; label: string }[];
export const GROCERY_AISLE_ORDER: IngredientCategory[];
export const GROCERY_SORT_OPTIONS: { id: GrocerySortMode; label: string }[];

export function normalizeStoreOrder(order?: string[] | null): IngredientCategory[];

export function getCategoryLabel(categoryId: string): string;

export function mergeItem(
  list: GroceryItem[],
  item: Partial<GroceryItem> & { ingredientId: string }
): GroceryItem[];

export function addRecipeItems(
  list: GroceryItem[],
  recipe: Recipe,
  household: Household,
  includeOptional?: boolean,
  ownedIngredientIds?: string[]
): GroceryItem[];

export function getMissingRecipeIngredientsCount(
  recipe: Recipe,
  ownedIngredientIds?: string[],
  includeOptional?: boolean
): number;

export function groupByCategory(
  list: GroceryItem[]
): { category: IngredientCategory; label: string; items: GroceryItem[] }[];

export function sortAndGroupGroceryItems(
  list: GroceryItem[],
  options?: {
    sortBy?: GrocerySortMode;
    selectedCategory?: IngredientCategory | 'all';
    categoryOrder?: IngredientCategory[];
  }
): {
  mode: 'grouped' | 'flat';
  groups: { category: string; label: string; items: GroceryItem[] }[];
  items: GroceryItem[];
  availableCategories: {
    id: IngredientCategory;
    label: string;
    count: number;
    uncheckedCount: number;
  }[];
};

export function toPlainText(
  list: GroceryItem[],
  options?: {
    showCost?: boolean;
    prices?: Record<string, { perUnitPaise: number; unit: string }>;
    sortBy?: GrocerySortMode;
    selectedCategory?: IngredientCategory | 'all';
    categoryOrder?: IngredientCategory[];
  }
): string;

