import { AllergyKey, DietType, Ingredient, Recipe } from '../types/cook';

export interface ExpiringIngredientItem {
  ingredient: Ingredient;
  expiryDate: string;
  daysRemaining: number;
  statusLabel: string;
  formattedDate: string;
  inPantry: boolean;
}

export interface ExpiringRecipeSuggestion {
  recipe: Recipe;
  usedExpiringIngredients: Ingredient[];
  totalMinutes: number;
}

export interface PantryExpirySummary {
  hasSelectedExpiring: boolean;
  items: ExpiringIngredientItem[];
  suggestions: ExpiringRecipeSuggestion[];
}

export function parseIsoDateLocal(iso: string): Date | null {
  if (typeof iso !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function getDaysUntilExpiry(
  expiryDate: string,
  referenceDate: Date = new Date()
): number | null {
  const exp = parseIsoDateLocal(expiryDate);
  if (!exp) return null;
  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  return Math.round((exp.getTime() - ref.getTime()) / 86400000);
}

export function formatExpiryCountdown(daysRemaining: number): string {
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining === 0) return 'Expires today';
  if (daysRemaining === 1) return 'Expires tomorrow';
  return `Expires in ${daysRemaining} days`;
}

export function formatExpiryDateShort(expiryDate: string): string {
  const parsed = parseIsoDateLocal(expiryDate);
  if (!parsed) return expiryDate;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function isRecipeSafeForPreferences(
  recipe: Recipe,
  defaultDiet: DietType,
  allergySet: Set<AllergyKey>,
  ingredientsById: Map<string, Ingredient>
): boolean {
  if (defaultDiet === 'veg' && recipe.diet !== 'veg') return false;
  if (Array.isArray(recipe.allergens)) {
    for (const a of recipe.allergens) {
      if (allergySet.has(a)) return false;
    }
  }
  for (const item of recipe.ingredients ?? []) {
    const ing = ingredientsById.get(item.ingredientId);
    if (!ing) continue;
    if (defaultDiet === 'veg' && !ing.isVeg) return false;
    if (Array.isArray(ing.allergens) && ing.allergens.some((a) => allergySet.has(a))) {
      return false;
    }
  }
  return true;
}

export function getPantryExpirySummary(params: {
  ingredients: Ingredient[];
  recipes: Recipe[];
  aiRecipes?: Recipe[];
  selectedIngredientIds?: string[];
  defaultDiet?: DietType;
  allergies?: AllergyKey[];
  referenceDate?: Date;
  windowDays?: number;
}): PantryExpirySummary {
  const {
    ingredients,
    recipes,
    aiRecipes = [],
    selectedIngredientIds = [],
    defaultDiet = 'veg',
    allergies = [],
    referenceDate = new Date(),
    windowDays = 7,
  } = params;

  const allergySet = new Set<AllergyKey>(allergies);
  const selectedSet = new Set<string>(selectedIngredientIds);
  const ingredientsById = new Map<string, Ingredient>(
    ingredients.map((ing) => [ing.id, ing])
  );

  const candidates: ExpiringIngredientItem[] = [];

  for (const ing of ingredients) {
    if (defaultDiet === 'veg' && !ing.isVeg) continue;
    if (Array.isArray(ing.allergens) && ing.allergens.some((a) => allergySet.has(a))) {
      continue;
    }
    if (!ing.expiryDate) continue;

    const daysRemaining = getDaysUntilExpiry(ing.expiryDate, referenceDate);
    if (daysRemaining === null || daysRemaining < -1 || daysRemaining > windowDays) {
      continue;
    }

    const inPantry = selectedSet.has(ing.id) && !ing.assumedAvailable;
    candidates.push({
      ingredient: ing,
      expiryDate: ing.expiryDate,
      daysRemaining,
      statusLabel: formatExpiryCountdown(daysRemaining),
      formattedDate: formatExpiryDateShort(ing.expiryDate),
      inPantry,
    });
  }

  candidates.sort((a, b) => {
    if (a.inPantry !== b.inPantry) return a.inPantry ? -1 : 1;
    if (a.daysRemaining !== b.daysRemaining) return a.daysRemaining - b.daysRemaining;
    return a.ingredient.name.localeCompare(b.ingredient.name);
  });

  const pantryExpiring = candidates.filter((c) => c.inPantry);
  const hasSelectedExpiring = pantryExpiring.length > 0;
  const items = hasSelectedExpiring
    ? pantryExpiring.slice(0, 6)
    : candidates.slice(0, 4);

  const targetIds = new Set(items.map((i) => i.ingredient.id));
  const itemById = new Map(items.map((i) => [i.ingredient.id, i]));

  const allRecipes = [...recipes, ...aiRecipes];
  const scoredSuggestions: {
    suggestion: ExpiringRecipeSuggestion;
    soonestDays: number;
    ownedCount: number;
  }[] = [];

  for (const recipe of allRecipes) {
    if (!isRecipeSafeForPreferences(recipe, defaultDiet, allergySet, ingredientsById)) {
      continue;
    }

    const matchedMap = new Map<string, Ingredient>();
    let soonestDays = Number.MAX_SAFE_INTEGER;
    let ownedCount = 0;

    for (const rIng of recipe.ingredients ?? []) {
      const ing = ingredientsById.get(rIng.ingredientId);
      if (!ing) continue;
      if (selectedSet.has(ing.id) || ing.assumedAvailable) {
        ownedCount += 1;
      }
      if (targetIds.has(ing.id) && !matchedMap.has(ing.id)) {
        matchedMap.set(ing.id, ing);
        const expInfo = itemById.get(ing.id);
        if (expInfo && expInfo.daysRemaining < soonestDays) {
          soonestDays = expInfo.daysRemaining;
        }
      }
    }

    if (matchedMap.size === 0) continue;

    const totalMinutes =
      (Number(recipe.prepMinutes) || 0) + (Number(recipe.cookMinutes) || 0);

    scoredSuggestions.push({
      suggestion: {
        recipe,
        usedExpiringIngredients: Array.from(matchedMap.values()),
        totalMinutes,
      },
      soonestDays,
      ownedCount,
    });
  }

  scoredSuggestions.sort((a, b) => {
    if (b.suggestion.usedExpiringIngredients.length !== a.suggestion.usedExpiringIngredients.length) {
      return (
        b.suggestion.usedExpiringIngredients.length -
        a.suggestion.usedExpiringIngredients.length
      );
    }
    if (a.soonestDays !== b.soonestDays) return a.soonestDays - b.soonestDays;
    if (b.ownedCount !== a.ownedCount) return b.ownedCount - a.ownedCount;
    return a.suggestion.totalMinutes - b.suggestion.totalMinutes;
  });

  return {
    hasSelectedExpiring,
    items,
    suggestions: scoredSuggestions.slice(0, 3).map((s) => s.suggestion),
  };
}
