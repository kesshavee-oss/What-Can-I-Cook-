// Pure recipe search, sorting, and availability filtering helpers for the Cook tab.
import {
  RECIPES,
  compareRecipeMatches,
  evaluateRecipeMatch,
  getIngredientById,
} from '../recipes.js';

export const RECIPE_SORT_OPTIONS = [
  { id: 'best_match', label: 'Best Match' },
  { id: 'quickest', label: 'Quickest to cook' },
  { id: 'least_missing', label: 'Least ingredients needed' },
];

function normalize(value) {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/\s+/g, ' ')
    : '';
}

function getTotalMinutes(recipe) {
  return (Number(recipe?.prepMinutes) || 0) + (Number(recipe?.cookMinutes) || 0);
}

function getMissingCount(recipe) {
  if (typeof recipe?.missingRequiredCount === 'number') {
    return recipe.missingRequiredCount;
  }
  return Array.isArray(recipe?.missingIngredients)
    ? recipe.missingIngredients.length
    : 0;
}

/**
 * Sort scored recipe matches by Best Match, Quickest to cook, or Least ingredients needed.
 * Returns a new sorted array without mutating the input.
 * @param {Array<object>} recipes
 * @param {"best_match"|"quickest"|"least_missing"} sortBy
 * @returns {Array<object>}
 */
export function sortRecipes(recipes, sortBy = 'best_match') {
  const list = Array.isArray(recipes) ? [...recipes] : [];

  return list.sort((a, b) => {
    if (sortBy === 'quickest') {
      const timeA = getTotalMinutes(a);
      const timeB = getTotalMinutes(b);
      if (timeA !== timeB) return timeA - timeB;
      return compareRecipeMatches(a, b);
    }

    if (sortBy === 'least_missing') {
      const missA = getMissingCount(a);
      const missB = getMissingCount(b);
      if (missA !== missB) return missA - missB;
      return compareRecipeMatches(a, b);
    }

    // Default: 'best_match' (coverage desc -> missingRequiredCount asc -> usedSelectedCount desc -> total time asc)
    return compareRecipeMatches(a, b);
  });
}

/**
 * Determine whether a recipe matches a search query by recipe title,
 * cuisine/tags, or any ingredient name or alias (e.g. "pyaz" -> Onion).
 * Multi-word queries require every token to match at least one field.
 * @param {object} recipe
 * @param {string} query
 * @returns {boolean}
 */
export function recipeMatchesQuery(recipe, query) {
  const normalized = normalize(query);
  if (!normalized) return true;
  if (!recipe || typeof recipe !== 'object') return false;

  const haystackParts = [
    normalize(recipe.name),
    normalize(recipe.cuisine),
    ...(Array.isArray(recipe.tags) ? recipe.tags.map(normalize) : []),
  ];

  if (Array.isArray(recipe.ingredients)) {
    for (const item of recipe.ingredients) {
      const ing = getIngredientById(item?.ingredientId);
      if (ing) {
        haystackParts.push(normalize(ing.name));
        if (Array.isArray(ing.aliases)) {
          for (const alias of ing.aliases) {
            haystackParts.push(normalize(alias));
          }
        }
      } else if (item?.ingredientId) {
        haystackParts.push(normalize(String(item.ingredientId).replace(/_/g, ' ')));
      }
    }
  }

  const haystack = haystackParts.filter(Boolean).join(' ');
  const tokens = normalized.split(' ').filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Score, filter, and sort all diet- and allergy-compatible recipes against owned main ingredients.
 * Excludes pantry staples (assumedAvailable: true) from denominator and missing list.
 * @param {{
 *   recipes?: Array<object>,
 *   diet?: "veg" | "nonveg",
 *   allergies?: string[],
 *   availableIngredientIds?: string[],
 *   query?: string,
 *   sortBy?: "best_match" | "quickest" | "least_missing",
 * }} params
 * @returns {Array<object>}
 */
export function filterAvailableRecipes({
  recipes = RECIPES,
  diet = 'veg',
  allergies = [],
  availableIngredientIds = [],
  query = '',
  sortBy = 'best_match',
} = {}) {
  const allergySet = new Set(Array.isArray(allergies) ? allergies : []);
  const ownedMainSet = new Set(
    (Array.isArray(availableIngredientIds) ? availableIngredientIds : []).filter(
      (id) => !getIngredientById(id)?.assumedAvailable
    )
  );
  const hasQuery = Boolean(normalize(query));

  const results = [];

  for (const recipe of Array.isArray(recipes) ? recipes : []) {
    if (!recipe || typeof recipe !== 'object') continue;
    if (!recipeMatchesQuery(recipe, query)) continue;

    const evaluated = evaluateRecipeMatch(recipe, ownedMainSet, {
      diet,
      allergySet,
    });
    if (!evaluated) continue;

    // When browsing without a text query, require at least one selected main ingredient
    if (!hasQuery && !evaluated.hasSelectedMainMatch) continue;

    const { hasSelectedMainMatch: _drop, ...cleanMatch } = evaluated;
    results.push(cleanMatch);
  }

  return sortRecipes(results, sortBy);
}

// Self-tests
(function runSelfTests() {
  const byName = filterAvailableRecipes({
    diet: 'veg',
    allergies: [],
    availableIngredientIds: ['poha', 'onion', 'salt'],
    query: 'poha',
  });
  console.assert(
    byName.some((r) => r.id === 'poha'),
    'Expected searching "poha" to find Poha'
  );

  const byAlias = filterAvailableRecipes({
    diet: 'veg',
    allergies: [],
    availableIngredientIds: [],
    query: 'pyaz',
  });
  console.assert(
    byAlias.length > 0 && byAlias.some((r) => r.id === 'poha'),
    'Expected searching ingredient alias "pyaz" to match recipes with Onion'
  );

  const vegChicken = filterAvailableRecipes({
    diet: 'veg',
    allergies: [],
    availableIngredientIds: [],
    query: 'chicken',
  });
  console.assert(
    vegChicken.length === 0,
    'Expected vegetarian mode search for "chicken" to return 0 non-veg recipes'
  );

  const eggExcluded = filterAvailableRecipes({
    diet: 'veg',
    allergies: ['egg'],
    availableIngredientIds: [],
    query: 'omelette',
  });
  console.assert(
    eggExcluded.length === 0,
    'Expected egg allergy filter to exclude omelette recipes'
  );

  const withoutStaples = filterAvailableRecipes({
    diet: 'veg',
    allergies: [],
    availableIngredientIds: ['poha', 'onion'],
    query: 'poha',
  });
  const withStaples = filterAvailableRecipes({
    diet: 'veg',
    allergies: [],
    availableIngredientIds: ['poha', 'onion', 'salt', 'oil', 'turmeric'],
    query: 'poha',
  });
  console.assert(
    withoutStaples.length === withStaples.length &&
      withoutStaples[0]?.matchScore === withStaples[0]?.matchScore,
    'Staples must not alter matchScore in filterAvailableRecipes'
  );

  // Sorting self-tests
  const samplePool = [
    {
      id: 'a',
      matchScore: 90,
      prepMinutes: 15,
      cookMinutes: 25,
      missingIngredients: [{ ingredientId: 'x' }, { ingredientId: 'y' }],
    },
    {
      id: 'b',
      matchScore: 60,
      prepMinutes: 5,
      cookMinutes: 5,
      missingIngredients: [{ ingredientId: 'x' }],
    },
    {
      id: 'c',
      matchScore: 75,
      prepMinutes: 10,
      cookMinutes: 15,
      missingIngredients: [],
    },
  ];

  const byBest = sortRecipes(samplePool, 'best_match');
  console.assert(
    byBest.map((r) => r.id).join(',') === 'a,c,b',
    `Expected best_match order a,c,b, got ${byBest.map((r) => r.id).join(',')}`
  );

  const byQuickest = sortRecipes(samplePool, 'quickest');
  console.assert(
    byQuickest.map((r) => r.id).join(',') === 'b,c,a',
    `Expected quickest order b,c,a, got ${byQuickest.map((r) => r.id).join(',')}`
  );

  const byLeastMissing = sortRecipes(samplePool, 'least_missing');
  console.assert(
    byLeastMissing.map((r) => r.id).join(',') === 'c,b,a',
    `Expected least_missing order c,b,a, got ${byLeastMissing.map((r) => r.id).join(',')}`
  );
})();
