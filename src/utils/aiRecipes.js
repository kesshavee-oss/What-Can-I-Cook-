// Pure prompt builder, strict schema/diet/allergy validation, matching helpers, and server proxy caller for AI-generated recipes.
import {
  INGREDIENTS,
  RECIPES,
  compareRecipeMatches,
  getIngredientById,
} from '../recipes.js';

export const MAX_AI_RECIPES = 30;
export const AI_TIMEOUT_MS = 20000;
export const AI_DISCLAIMER_TEXT =
  'Created by AI. Check ingredients, quantities, and nutrition before cooking. Values are estimates.';

const VALID_DIETS = new Set(['veg', 'nonveg']);
const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'snacks', 'dinner']);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const NUTRITION_KEYS = [
  'calories',
  'protein',
  'calcium',
  'iron',
  'vitaminC',
  'fiber',
  'fat',
  'carbs',
];

function slugifyId(text) {
  const base = String(text || 'recipe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `ai_${base || 'dish'}_${rand}`;
}

/**
 * Build the structured prompt sent to Gemini using only sanitized kitchen state
 * (selected ingredient IDs, diet, meal type, allergies, and adult/child counts).
 * Never includes user names, dates, notes, or cooked meal history.
 *
 * @param {{
 *   selectedIngredientIds?: string[],
 *   diet?: 'veg'|'nonveg',
 *   mealType?: 'breakfast'|'lunch'|'snacks'|'dinner',
 *   allergies?: string[],
 *   adultsCount?: number,
 *   childrenCount?: number,
 *   ingredientsList?: Array<object>
 * }} input
 * @returns {string}
 */
export function buildPrompt(input = {}) {
  const safeIngredients = Array.isArray(input.ingredientsList)
    ? input.ingredientsList
    : INGREDIENTS;
  const diet = input.diet === 'nonveg' ? 'nonveg' : 'veg';
  const mealType = VALID_MEAL_TYPES.has(input.mealType) ? input.mealType : 'dinner';
  const allergies = Array.isArray(input.allergies) ? input.allergies : [];
  const allergySet = new Set(allergies);
  const selectedIds = Array.isArray(input.selectedIngredientIds)
    ? input.selectedIngredientIds
    : [];
  const adultsCount = Math.max(1, Number(input.adultsCount) || 1);
  const childrenCount = Math.max(0, Number(input.childrenCount) || 0);

  const compatibleIngredients = safeIngredients.filter((ing) => {
    if (diet === 'veg' && !ing.isVeg) return false;
    const ingAllergens = Array.isArray(ing.allergens) ? ing.allergens : [];
    if (ingAllergens.some((a) => allergySet.has(a))) return false;
    return true;
  });

  const allowedIdsList = compatibleIngredients
    .map((ing) => `${ing.id} (${ing.name}${ing.assumedAvailable ? ', staple' : ''})`)
    .join(', ');

  const selectedNames = selectedIds
    .map((id) => {
      const found = safeIngredients.find((i) => i.id === id);
      return found ? `${found.id} (${found.name})` : id;
    })
    .filter(Boolean);

  const eggRule = allergies.includes('egg')
    ? 'Egg allergy is ON: do NOT use eggs or egg products.'
    : diet === 'veg'
    ? 'Eggs are allowed in veg mode unless egg allergy is active.'
    : 'Eggs are allowed.';

  const vegRule =
    diet === 'veg'
      ? 'Diet is VEGETARIAN (veg): strictly NO meat, poultry, fish, seafood, or meat-based stock.'
      : 'Diet is NON-VEGETARIAN (nonveg): both meat/seafood and vegetarian dishes are allowed.';

  const allergyRule =
    allergies.length > 0
      ? `Allergies to strictly EXCLUDE: ${allergies.join(', ')}.`
      : 'Allergies: none.';

  return [
    'Generate 3 practical home-cooked recipes as a raw JSON array.',
    `Household: ${adultsCount} adult(s), ${childrenCount} child(ren).`,
    `Target mealType: "${mealType}" (include "${mealType}" in mealTypes).`,
    vegRule,
    eggRule,
    allergyRule,
    `Selected ingredients on hand: ${selectedNames.length > 0 ? selectedNames.join(', ') : 'pantry basics only'}.`,
    'RULES:',
    '1. Use ONLY exact ingredientId values from ALLOWED_INGREDIENT_IDS below.',
    `2. Set diet to "${diet}" and include "${mealType}" in mealTypes (allowed: "breakfast", "lunch", "snacks", "dinner"); set difficulty to "easy", "medium", or "hard".`,
    '3. Primarily use selected ingredients on hand plus pantry staples so >= 60% of required non-staple ingredients are on hand.',
    '4. Keep steps concise (3-5 steps); set timerSeconds to positive integer seconds or null.',
    '5. nutritionPerServing values must be realistic estimates per 1 adult serving.',
    `ALLOWED_INGREDIENT_IDS: ${allowedIdsList}`,
  ].join('\n');
}

/**
 * Build a sanitized prompt for Gemini to produce cooking pro tips and ingredient substitutions
 * for a single recipe while strictly respecting diet and allergy restrictions.
 *
 * @param {{
 *   recipeName?: string,
 *   diet?: 'veg'|'nonveg',
 *   cuisine?: string,
 *   ingredientNames?: string[],
 *   stepTexts?: string[],
 *   allergies?: string[]
 * }} input
 * @returns {string}
 */
export function buildRecipeTipsPrompt(input = {}) {
  const recipeName =
    typeof input.recipeName === 'string' && input.recipeName.trim()
      ? input.recipeName.trim().slice(0, 120)
      : 'Home-cooked dish';
  const diet = input.diet === 'nonveg' ? 'nonveg' : 'veg';
  const cuisine =
    typeof input.cuisine === 'string' && input.cuisine.trim()
      ? input.cuisine.trim().slice(0, 60)
      : 'Home-cooked';
  const ingredientNames = Array.isArray(input.ingredientNames)
    ? input.ingredientNames.filter((s) => typeof s === 'string' && s.trim().length > 0).slice(0, 30)
    : [];
  const stepTexts = Array.isArray(input.stepTexts)
    ? input.stepTexts.filter((s) => typeof s === 'string' && s.trim().length > 0).slice(0, 20)
    : [];
  const allergies = Array.isArray(input.allergies)
    ? input.allergies.filter((a) => typeof a === 'string' && a.trim().length > 0)
    : [];

  const dietRule =
    diet === 'veg'
      ? 'Diet is VEGETARIAN (veg): NEVER suggest meat, poultry, fish, seafood, or meat stock in tips or substitutions.'
      : 'Diet is NON-VEGETARIAN (nonveg).';
  const allergyRule =
    allergies.length > 0
      ? `Active household allergies (STRICTLY NEVER recommend these in substitutions or tips): ${allergies.join(', ')}.`
      : 'No excluded allergies.';

  return [
    `Recipe: "${recipeName}" (${cuisine})`,
    dietRule,
    allergyRule,
    `Ingredients: ${ingredientNames.length > 0 ? ingredientNames.join(', ') : 'standard pantry ingredients'}`,
    stepTexts.length > 0
      ? `Cooking steps:\n${stepTexts.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : 'Cooking steps: general home preparation',
    'Provide 3-4 practical cooking pro tips tailored to this dish and 3-4 common household ingredient substitutions.',
    'Keep every tip and substitution concise, plain-English, and practical for a home kitchen.',
  ].join('\n');
}

/**
 * Parse raw JSON array text returned from Gemini (stripping stray code fences if any).
 * @param {unknown} text
 * @returns {{ ok: true, recipes: Array<object> } | { ok: false, error: string }}
 */
export function parseAiRecipes(text) {
  if (Array.isArray(text)) {
    return { ok: true, recipes: text };
  }
  if (text && typeof text === 'object' && Array.isArray(text.recipes)) {
    return { ok: true, recipes: text.recipes };
  }
  if (typeof text !== 'string') {
    return { ok: false, error: 'Response was not readable text.' };
  }

  let cleaned = text.trim();
  if (!cleaned) {
    return { ok: false, error: 'Empty response from model.' };
  }

  // Strip accidental markdown fences if the model included any
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return { ok: true, recipes: parsed };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.recipes)) {
      return { ok: true, recipes: parsed.recipes };
    }
    return { ok: false, error: 'Model output JSON was not an array.' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid JSON syntax.',
    };
  }
}

/**
 * Validate and normalize a single AI-proposed recipe against INGREDIENTS, diet, allergies,
 * built-in recipe names, required steps/ingredients/nutrition, and match score computation.
 *
 * @param {unknown} recipe
 * @param {Array<object>} [ingredients]
 * @param {{
 *   diet?: 'veg'|'nonveg',
 *   mealType?: string,
 *   allergies?: string[],
 *   availableIngredientIds?: string[],
 *   existingRecipeNames?: string[]
 * }} [allowedFilters]
 * @returns {{ valid: true, recipe: object } | { valid: false, reason: string }}
 */
export function validateAiRecipe(recipe, ingredients = INGREDIENTS, allowedFilters = {}) {
  if (!recipe || typeof recipe !== 'object' || Array.isArray(recipe)) {
    return { valid: false, reason: 'Recipe is not a valid object.' };
  }

  const name = typeof recipe.name === 'string' ? recipe.name.trim() : '';
  if (!name) {
    return { valid: false, reason: 'Recipe is missing a name.' };
  }

  const builtInNames = new Set(
    (Array.isArray(allowedFilters?.existingRecipeNames)
      ? allowedFilters.existingRecipeNames
      : RECIPES.map((r) => r.name)
    ).map((n) => String(n).trim().toLowerCase())
  );
  if (builtInNames.has(name.toLowerCase())) {
    return { valid: false, reason: `Recipe "${name}" matches a built-in recipe name.` };
  }

  const catalogList = Array.isArray(ingredients) ? ingredients : INGREDIENTS;
  const ingMap = new Map(catalogList.map((i) => [i.id, i]));

  const recipeDiet = VALID_DIETS.has(recipe.diet) ? recipe.diet : null;
  if (!recipeDiet) {
    return { valid: false, reason: 'Recipe diet must be "veg" or "nonveg".' };
  }
  if (allowedFilters?.diet === 'veg' && recipeDiet !== 'veg') {
    return { valid: false, reason: 'Non-veg recipe rejected under vegetarian filter.' };
  }

  const allergySet = new Set(
    Array.isArray(allowedFilters?.allergies) ? allowedFilters.allergies : []
  );

  // Validate declared recipe allergens
  const declaredAllergens = Array.isArray(recipe.allergens)
    ? recipe.allergens.filter((a) => typeof a === 'string')
    : [];
  if (declaredAllergens.some((a) => allergySet.has(a))) {
    return { valid: false, reason: 'Recipe declares an excluded allergen.' };
  }

  // Validate ingredients
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return { valid: false, reason: 'Recipe has no ingredients.' };
  }

  const ownedMainSet = new Set(
    (Array.isArray(allowedFilters?.availableIngredientIds)
      ? allowedFilters.availableIngredientIds
      : []
    ).filter((id) => !ingMap.get(id)?.assumedAvailable)
  );

  const normalizedIngredients = [];
  const haveIngredients = [];
  const missingIngredients = [];
  const usedSelectedIngredients = [];
  const allMainIds = [];
  const requiredMainIds = [];
  const derivedAllergens = new Set(declaredAllergens);
  let requiredNonStapleTotal = 0;
  let requiredNonStapleOwned = 0;
  let matchedAnyMainCount = 0;

  for (const item of recipe.ingredients) {
    if (!item || typeof item !== 'object' || typeof item.ingredientId !== 'string') {
      return { valid: false, reason: 'Ingredient entry is malformed.' };
    }
    const catalog = ingMap.get(item.ingredientId) ?? null;
    if (!catalog) {
      return {
        valid: false,
        reason: `Unknown ingredientId "${item.ingredientId}" not in INGREDIENTS.`,
      };
    }
    if ((recipeDiet === 'veg' || allowedFilters?.diet === 'veg') && !catalog.isVeg) {
      return {
        valid: false,
        reason: `Vegetarian recipe cannot use non-veg ingredient "${catalog.id}".`,
      };
    }
    const ingAllergens = Array.isArray(catalog.allergens) ? catalog.allergens : [];
    if (ingAllergens.some((a) => allergySet.has(a))) {
      return {
        valid: false,
        reason: `Ingredient "${catalog.id}" violates active allergy filter.`,
      };
    }
    for (const a of ingAllergens) {
      derivedAllergens.add(a);
    }

    const numAmount = Number(item.amount);
    const normalizedItem = {
      ingredientId: catalog.id,
      amount: Number.isFinite(numAmount) && numAmount > 0 ? Math.round(numAmount * 100) / 100 : 1,
      unit:
        typeof item.unit === 'string' && item.unit.trim().length > 0
          ? item.unit.trim()
          : 'pcs',
      optional: Boolean(item.optional),
    };
    normalizedIngredients.push(normalizedItem);

    const isStaple = Boolean(catalog.assumedAvailable);
    if (isStaple) {
      haveIngredients.push(normalizedItem);
      continue;
    }

    allMainIds.push(catalog.id);
    if (!normalizedItem.optional) {
      requiredMainIds.push(catalog.id);
    }

    const userHasMain = ownedMainSet.has(catalog.id);
    if (userHasMain) {
      haveIngredients.push(normalizedItem);
      usedSelectedIngredients.push(normalizedItem);
      matchedAnyMainCount += 1;
    } else if (!normalizedItem.optional) {
      missingIngredients.push(normalizedItem);
    }

    if (!normalizedItem.optional) {
      requiredNonStapleTotal += 1;
      if (userHasMain) {
        requiredNonStapleOwned += 1;
      }
    }
  }

  // Validate steps
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    return { valid: false, reason: 'Recipe has no steps.' };
  }
  const normalizedSteps = [];
  for (const step of recipe.steps) {
    if (!step || typeof step !== 'object') continue;
    const text = typeof step.text === 'string' ? step.text.trim() : '';
    if (!text) continue;
    const rawTimer = step.timerSeconds;
    const timerSeconds =
      typeof rawTimer === 'number' && Number.isFinite(rawTimer) && rawTimer > 0
        ? Math.round(rawTimer)
        : null;
    normalizedSteps.push({ text, timerSeconds });
  }
  if (normalizedSteps.length === 0) {
    return { valid: false, reason: 'Recipe steps contain no instructions.' };
  }

  // Validate nutritionPerServing (drop if missing completely / lacks core values; fill omitted fields with null, NEVER 0)
  const rawNut = recipe.nutritionPerServing;
  if (!rawNut || typeof rawNut !== 'object' || Array.isArray(rawNut)) {
    return { valid: false, reason: 'Recipe is missing nutritionPerServing.' };
  }

  const normalizedNutrition = {};
  let validNutCount = 0;
  for (const key of NUTRITION_KEYS) {
    const val = rawNut[key];
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      normalizedNutrition[key] = Math.round(val * 10) / 10;
      validNutCount += 1;
    } else {
      normalizedNutrition[key] = null;
    }
  }

  if (
    validNutCount === 0 ||
    (normalizedNutrition.calories === null && normalizedNutrition.protein === null)
  ) {
    return { valid: false, reason: 'Recipe has missing nutrition fields.' };
  }

  const rawMealTypes = Array.isArray(recipe.mealTypes)
    ? recipe.mealTypes.filter((mt) => VALID_MEAL_TYPES.has(mt))
    : [];
  const fallbackMeal = VALID_MEAL_TYPES.has(allowedFilters?.mealType)
    ? allowedFilters.mealType
    : 'dinner';
  const mealTypes = rawMealTypes.length > 0 ? rawMealTypes : [fallbackMeal];

  const coverage =
    requiredNonStapleTotal === 0
      ? 1
      : requiredNonStapleOwned / requiredNonStapleTotal;
  const matchScore = Math.round(coverage * 100);
  const missingRequiredCount = missingIngredients.length;
  const usedSelectedCount = usedSelectedIngredients.length;
  const hasSelectedMainMatch =
    requiredNonStapleTotal > 0 ? requiredNonStapleOwned >= 1 : matchedAnyMainCount >= 1;
  const keyIds = requiredMainIds.length > 0 ? requiredMainIds : allMainIds;
  const mainIngredientSetKey = Array.from(new Set(keyIds)).sort().join('|');

  const safeId =
    typeof recipe.id === 'string' && recipe.id.trim().startsWith('ai_')
      ? recipe.id.trim()
      : slugifyId(name);

  return {
    valid: true,
    recipe: {
      id: safeId,
      source: 'ai',
      isAiGenerated: true,
      name,
      mealTypes,
      diet: recipeDiet,
      allergens: Array.from(derivedAllergens),
      cuisine:
        typeof recipe.cuisine === 'string' && recipe.cuisine.trim()
          ? recipe.cuisine.trim()
          : 'Home-cooked',
      difficulty: VALID_DIFFICULTIES.has(recipe.difficulty) ? recipe.difficulty : 'easy',
      prepMinutes:
        typeof recipe.prepMinutes === 'number' &&
        Number.isFinite(recipe.prepMinutes) &&
        recipe.prepMinutes >= 0
          ? Math.round(recipe.prepMinutes)
          : 10,
      cookMinutes:
        typeof recipe.cookMinutes === 'number' &&
        Number.isFinite(recipe.cookMinutes) &&
        recipe.cookMinutes >= 0
          ? Math.round(recipe.cookMinutes)
          : 15,
      baseServings:
        typeof recipe.baseServings === 'number' &&
        Number.isFinite(recipe.baseServings) &&
        recipe.baseServings >= 1
          ? Math.round(recipe.baseServings)
          : 1,
      ingredients: normalizedIngredients,
      steps: normalizedSteps,
      nutritionPerServing: normalizedNutrition,
      tags: Array.isArray(recipe.tags)
        ? recipe.tags.filter((t) => typeof t === 'string' && t.trim().length > 0)
        : ['ai-idea'],
      matchScore,
      coverage,
      missingRequiredCount,
      usedSelectedCount,
      usedSelectedIngredients,
      mainIngredientSetKey,
      hasSelectedMainMatch,
      haveIngredients,
      missingIngredients,
    },
  };
}

/**
 * Filter out any invalid AI recipes and return validated, normalized RecipeMatch items.
 * @param {Array<object>} recipes
 * @param {Array<object>} [ingredients]
 * @param {object} [filters]
 * @returns {Array<object>}
 */
export function dropInvalid(recipes, ingredients = INGREDIENTS, filters = {}) {
  if (!Array.isArray(recipes)) return [];
  const validList = [];
  const seenNames = new Set();

  for (const item of recipes) {
    const check = validateAiRecipe(item, ingredients, filters);
    if (!check.valid) continue;
    const key = check.recipe.name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    validList.push(check.recipe);
  }

  return validList;
}

/**
 * Filter saved AI recipes to only those strictly compatible with current Cook filters
 * (same diet, matching mealType, zero excluded allergens, >= 50% match score).
 *
 * @param {Array<object>} savedAiRecipes
 * @param {{ diet?: 'veg'|'nonveg', mealType?: string, allergies?: string[], availableIngredientIds?: string[] }} filters
 * @returns {Array<object>}
 */
export function matchSavedAiRecipes(savedAiRecipes, filters = {}) {
  if (!Array.isArray(savedAiRecipes) || savedAiRecipes.length === 0) return [];
  const targetDiet = filters.diet === 'nonveg' ? 'nonveg' : 'veg';
  const targetMeal = filters.mealType;
  const ownedMainCount = (
    Array.isArray(filters.availableIngredientIds) ? filters.availableIngredientIds : []
  ).filter((id) => !getIngredientById(id)?.assumedAvailable).length;

  if (ownedMainCount === 0) return [];

  const validated = dropInvalid(savedAiRecipes, INGREDIENTS, {
    ...filters,
    diet: targetDiet,
  });

  return validated
    .filter((r) => {
      // Do not auto-show old AI recipes generated for a different diet
      if (r.diet !== targetDiet) return false;
      if (targetMeal && !r.mealTypes.includes(targetMeal)) return false;
      if (!r.hasSelectedMainMatch) return false;
      return r.matchScore >= 50;
    })
    .sort(compareRecipeMatches);
}

/**
 * Merge newly validated AI recipes into storage while enforcing the 30-recipe limit
 * (oldest entries are removed first when exceeding MAX_AI_RECIPES).
 *
 * @param {Array<object>} existing
 * @param {Array<object>} newlyGenerated
 * @returns {Array<object>}
 */
export function mergeAiRecipesStore(existing = [], newlyGenerated = []) {
  const safeExisting = Array.isArray(existing) ? existing : [];
  const safeNew = Array.isArray(newlyGenerated) ? newlyGenerated : [];

  // Keep unique by lowercase name or id, placing newest at the end so .slice(-MAX) drops oldest
  const byKey = new Map();
  for (const r of safeExisting) {
    if (r && typeof r.name === 'string') {
      byKey.set(r.name.trim().toLowerCase(), r);
    }
  }
  for (const r of safeNew) {
    if (r && typeof r.name === 'string') {
      byKey.delete(r.name.trim().toLowerCase());
      byKey.set(r.name.trim().toLowerCase(), r);
    }
  }

  return Array.from(byKey.values()).slice(-MAX_AI_RECIPES);
}

/**
 * Query server health endpoint to check whether a Gemini API key is configured.
 * Fails silently to false so the app never shows errors when AI is unconfigured.
 * @param {AbortSignal} [signal]
 * @returns {Promise<boolean>}
 */
export async function checkAiAvailability(signal) {
  try {
    const res = await fetch('/api/health', { signal });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.aiAvailable);
  } catch {
    return false;
  }
}

/**
 * Request 3 AI-generated recipes from the server proxy with 20s timeout, cancellation support,
 * single retry on JSON parse failure, and strict validation.
 *
 * Only sends sanitized kitchen inputs: selectedIngredientIds, diet, mealType, allergies,
 * adultsCount, and childrenCount. Never sends user names, dates, notes, or cooked history.
 *
 * @param {{
 *   selectedIngredientIds: string[],
 *   diet: 'veg'|'nonveg',
 *   mealType: 'breakfast'|'lunch'|'snacks'|'dinner',
 *   allergies: string[],
 *   adultsCount: number,
 *   childrenCount: number
 * }} input
 * @param {AbortSignal} [signal]
 * @returns {Promise<{
 *   ok: true,
 *   recipes: Array<object>
 * } | {
 *   ok: false,
 *   code: 'ABORTED'|'TIMEOUT'|'RATE_LIMIT'|'KEY_ERROR'|'PARSE_ERROR'|'NO_SAFE_RECIPES'|'NETWORK'|'UPSTREAM_ERROR',
 *   message: string
 * }>}
 */
export async function generateRecipes(input, signal) {
  const sanitizedPayload = {
    selectedIngredientIds: Array.isArray(input?.selectedIngredientIds)
      ? [...input.selectedIngredientIds]
      : [],
    diet: input?.diet === 'nonveg' ? 'nonveg' : 'veg',
    mealType: VALID_MEAL_TYPES.has(input?.mealType) ? input.mealType : 'dinner',
    allergies: Array.isArray(input?.allergies) ? [...input.allergies] : [],
    adultsCount: Math.max(1, Number(input?.adultsCount) || 1),
    childrenCount: Math.max(0, Number(input?.childrenCount) || 0),
  };

  if (signal?.aborted) {
    return { ok: false, code: 'ABORTED', message: 'Cancelled.' };
  }

  const maxAttempts = 2; // Retry once on JSON parse failure
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    let timedOut = false;

    const onExternalAbort = () => controller.abort();
    signal?.addEventListener('abort', onExternalAbort, { once: true });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, AI_TIMEOUT_MS);

    try {
      const response = await fetch('/api/recipes/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onExternalAbort);

      if (!response.ok) {
        let serverCode = 'UPSTREAM_ERROR';
        let serverMessage = '';
        try {
          const errJson = await response.json();
          if (errJson?.code) serverCode = errJson.code;
          if (errJson?.error) serverMessage = String(errJson.error);
        } catch {
          // ignore JSON parse failure on error body
        }

        console.error('AI recipes request failed:', {
          status: response.status,
          code: serverCode,
          message: serverMessage || response.statusText,
        });

        if (response.status === 429 || serverCode === 'RATE_LIMIT') {
          return {
            ok: false,
            code: 'RATE_LIMIT',
            message: 'AI suggestions are not available right now',
          };
        }
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 503 ||
          serverCode === 'KEY_ERROR' ||
          serverCode === 'KEY_UNAVAILABLE'
        ) {
          return {
            ok: false,
            code: 'KEY_ERROR',
            message: 'AI suggestions are not available right now',
          };
        }
        if (response.status === 504 || serverCode === 'TIMEOUT') {
          return {
            ok: false,
            code: 'TIMEOUT',
            message: 'Request timed out. You can retry or use built-in recipes.',
          };
        }
        return {
          ok: false,
          code: 'UPSTREAM_ERROR',
          message: 'Could not create recipes right now. Try again.',
        };
      }

      const data = await response.json();
      const rawCandidate = data?.rawText ?? data?.recipes;
      const parsed = parseAiRecipes(rawCandidate);

      if (!parsed.ok) {
        console.warn(`AI recipe JSON parse failed (attempt ${attempt}):`, parsed.error);
        if (attempt < maxAttempts) {
          continue;
        }
        return {
          ok: false,
          code: 'PARSE_ERROR',
          message: 'Could not create recipes right now. Try again.',
        };
      }

      const safeRecipes = dropInvalid(parsed.recipes, INGREDIENTS, {
        diet: sanitizedPayload.diet,
        mealType: sanitizedPayload.mealType,
        allergies: sanitizedPayload.allergies,
        availableIngredientIds: sanitizedPayload.selectedIngredientIds,
      });

      if (safeRecipes.length === 0) {
        return {
          ok: false,
          code: 'NO_SAFE_RECIPES',
          message: 'No safe recipes were created. Try different ingredients.',
        };
      }

      return { ok: true, recipes: safeRecipes };
    } catch (err) {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onExternalAbort);

      if (signal?.aborted && !timedOut) {
        return { ok: false, code: 'ABORTED', message: 'Cancelled.' };
      }
      if (timedOut) {
        console.warn('AI recipe generation timed out after 20s.');
        return {
          ok: false,
          code: 'TIMEOUT',
          message: 'Request timed out. You can retry or use built-in recipes.',
        };
      }
      console.error('AI recipe network error:', err);
      return {
        ok: false,
        code: 'NETWORK',
        message: 'Could not reach AI suggestions. Check your connection and retry.',
      };
    }
  }

  return {
    ok: false,
    code: 'PARSE_ERROR',
    message: 'Could not create recipes right now. Try again.',
  };
}

/**
 * Parse and normalize structured AI pro tips & substitutions JSON.
 * @param {unknown} raw
 * @returns {{
 *   ok: true,
 *   proTips: string[],
 *   substitutions: Array<{ ingredient: string, substitute: string, reason: string }>
 * } | {
 *   ok: false,
 *   error: string
 * }}
 */
export function parseAiRecipeTips(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    let cleaned = raw.trim();
    if (!cleaned) {
      return { ok: false, error: 'Empty response from model.' };
    }
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      cleaned = fenceMatch[1].trim();
    }
    try {
      obj = JSON.parse(cleaned);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Invalid JSON syntax.',
      };
    }
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, error: 'Model output was not an object.' };
  }

  const proTips = Array.isArray(obj.proTips)
    ? obj.proTips
        .filter((tip) => typeof tip === 'string' && tip.trim().length > 0)
        .map((tip) => tip.trim())
        .slice(0, 5)
    : [];

  const substitutions = Array.isArray(obj.substitutions)
    ? obj.substitutions
        .filter(
          (sub) =>
            sub &&
            typeof sub === 'object' &&
            typeof sub.ingredient === 'string' &&
            sub.ingredient.trim().length > 0 &&
            typeof sub.substitute === 'string' &&
            sub.substitute.trim().length > 0
        )
        .map((sub) => ({
          ingredient: sub.ingredient.trim(),
          substitute: sub.substitute.trim(),
          reason:
            typeof sub.reason === 'string' && sub.reason.trim().length > 0
              ? sub.reason.trim()
              : 'Works as a direct swap.',
        }))
        .slice(0, 5)
    : [];

  if (proTips.length === 0 && substitutions.length === 0) {
    return { ok: false, error: 'No usable tips or substitutions returned.' };
  }

  return {
    ok: true,
    proTips,
    substitutions,
  };
}

/**
 * Request pro tips and common ingredient substitutions for a single recipe from /api/recipes/tips.
 * Sends only sanitized recipe structure and allergy filters.
 *
 * @param {{
 *   recipeName: string,
 *   diet?: 'veg'|'nonveg',
 *   cuisine?: string,
 *   ingredientNames?: string[],
 *   stepTexts?: string[],
 *   allergies?: string[]
 * }} input
 * @param {AbortSignal} [signal]
 */
export async function generateRecipeTipsAndSubstitutions(input, signal) {
  const sanitizedPayload = {
    recipeName:
      typeof input?.recipeName === 'string' ? input.recipeName.trim().slice(0, 120) : '',
    diet: input?.diet === 'nonveg' ? 'nonveg' : 'veg',
    cuisine:
      typeof input?.cuisine === 'string' ? input.cuisine.trim().slice(0, 60) : 'Home-cooked',
    ingredientNames: Array.isArray(input?.ingredientNames)
      ? input.ingredientNames
          .filter((s) => typeof s === 'string' && s.trim().length > 0)
          .slice(0, 30)
      : [],
    stepTexts: Array.isArray(input?.stepTexts)
      ? input.stepTexts
          .filter((s) => typeof s === 'string' && s.trim().length > 0)
          .slice(0, 20)
      : [],
    allergies: Array.isArray(input?.allergies)
      ? input.allergies.filter((a) => typeof a === 'string' && a.trim().length > 0)
      : [],
  };

  if (!sanitizedPayload.recipeName) {
    return {
      ok: false,
      code: 'UPSTREAM_ERROR',
      message: 'Recipe name is required to get cooking tips.',
    };
  }

  if (signal?.aborted) {
    return { ok: false, code: 'ABORTED', message: 'Cancelled.' };
  }

  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort, { once: true });

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, AI_TIMEOUT_MS);

  try {
    const response = await fetch('/api/recipes/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);

    if (!response.ok) {
      let serverCode = 'UPSTREAM_ERROR';
      let serverMessage = '';
      try {
        const errJson = await response.json();
        if (errJson?.code) serverCode = errJson.code;
        if (errJson?.error) serverMessage = String(errJson.error);
      } catch {
        // ignore JSON parse failure on error body
      }

      console.error('AI recipe tips request failed:', {
        status: response.status,
        code: serverCode,
        message: serverMessage || response.statusText,
      });

      if (response.status === 429 || serverCode === 'RATE_LIMIT') {
        return {
          ok: false,
          code: 'RATE_LIMIT',
          message: 'AI tips are busy right now. Try again in a minute.',
        };
      }
      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 503 ||
        serverCode === 'KEY_ERROR' ||
        serverCode === 'KEY_UNAVAILABLE'
      ) {
        return {
          ok: false,
          code: 'KEY_ERROR',
          message: 'AI tips are not set up for this app yet.',
        };
      }
      if (response.status === 504 || serverCode === 'TIMEOUT') {
        return {
          ok: false,
          code: 'TIMEOUT',
          message: 'The AI request timed out. Try again.',
        };
      }
      return {
        ok: false,
        code: 'UPSTREAM_ERROR',
        message: 'The AI reply was not in the expected format. Try again.',
      };
    }

    const data = await response.json();
    const parsed = parseAiRecipeTips(data?.rawText ?? data);
    if (!parsed.ok) {
      console.error('AI recipe tips parse error:', parsed.error);
      return {
        ok: false,
        code: 'PARSE_ERROR',
        message: 'The AI reply was not in the expected format. Try again.',
      };
    }

    return {
      ok: true,
      proTips: parsed.proTips,
      substitutions: parsed.substitutions,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);

    if (signal?.aborted && !timedOut) {
      return { ok: false, code: 'ABORTED', message: 'Cancelled.' };
    }
    if (timedOut) {
      console.error('AI recipe tips timed out after 20s.');
      return {
        ok: false,
        code: 'TIMEOUT',
        message: 'The AI request timed out. Try again.',
      };
    }
    console.error('AI recipe tips network error:', err);
    return {
      ok: false,
      code: 'NETWORK',
      message: 'Could not reach the AI service. Check your internet and retry.',
    };
  }
}

// Self-tests
(function runSelfTests() {
  const validSample = {
    id: 'ai_onion_egg_scramble',
    source: 'ai',
    name: 'Spiced Onion Tomato Scramble',
    mealTypes: ['breakfast', 'dinner'],
    diet: 'veg',
    allergens: ['egg'],
    cuisine: 'Indian',
    difficulty: 'easy',
    prepMinutes: 5,
    cookMinutes: 10,
    baseServings: 1,
    ingredients: [
      { ingredientId: 'egg', amount: 2, unit: 'pcs', optional: false },
      { ingredientId: 'onion', amount: 1, unit: 'pcs', optional: false },
      { ingredientId: 'salt', amount: 0.5, unit: 'tsp', optional: false },
    ],
    steps: [
      { text: 'Saute chopped onion with salt until golden.', timerSeconds: 180 },
      { text: 'Whisk eggs and scramble gently until cooked.', timerSeconds: 180 },
    ],
    nutritionPerServing: {
      calories: 240,
      protein: 15,
      calcium: 60,
      iron: 2.1,
      vitaminC: 8,
      fiber: 1.5,
      fat: 16,
      carbs: 8,
    },
    tags: ['quick'],
  };

  // 1. Valid recipe passes & recomputes matchScore
  const passRes = validateAiRecipe(validSample, INGREDIENTS, {
    diet: 'veg',
    mealType: 'dinner',
    allergies: [],
    availableIngredientIds: ['egg', 'onion'],
  });
  console.assert(
    passRes.valid === true && passRes.recipe.matchScore === 100 && passRes.recipe.source === 'ai',
    'Valid AI recipe should pass and compute 100% match (salt is assumedAvailable)'
  );

  // 2. Unknown ingredientId fails
  const badIngRes = validateAiRecipe(
    {
      ...validSample,
      name: 'Alien Herb Pasta',
      ingredients: [{ ingredientId: 'unicorn_herb', amount: 1, unit: 'tsp', optional: false }],
    },
    INGREDIENTS,
    { diet: 'veg', mealType: 'dinner', allergies: [] }
  );
  console.assert(badIngRes.valid === false, 'Recipe with unknown ingredientId must fail');

  // 3. Veg recipe containing chicken fails
  const vegChickenRes = validateAiRecipe(
    {
      ...validSample,
      name: 'Veg Chicken Skillet',
      diet: 'veg',
      ingredients: [{ ingredientId: 'chicken_curry_cut', amount: 200, unit: 'g', optional: false }],
    },
    INGREDIENTS,
    { diet: 'veg', mealType: 'dinner', allergies: [] }
  );
  console.assert(vegChickenRes.valid === false, 'Veg recipe with chicken must fail');

  // 4. Egg-allergy recipe containing eggs fails
  const eggAllergyRes = validateAiRecipe(validSample, INGREDIENTS, {
    diet: 'veg',
    mealType: 'dinner',
    allergies: ['egg'],
  });
  console.assert(eggAllergyRes.valid === false, 'Egg-allergy recipe with eggs must fail');

  // 5. Recipe missing steps fails
  const noStepsRes = validateAiRecipe(
    { ...validSample, name: 'No Steps Dish', steps: [] },
    INGREDIENTS,
    { diet: 'veg', mealType: 'dinner', allergies: [] }
  );
  console.assert(noStepsRes.valid === false, 'Recipe missing steps must fail');

  // 6. Missing nutrition fields check & null fill (never 0)
  const noNutRes = validateAiRecipe(
    { ...validSample, name: 'No Nutrition Dish', nutritionPerServing: null },
    INGREDIENTS,
    { diet: 'veg', mealType: 'dinner', allergies: [] }
  );
  console.assert(noNutRes.valid === false, 'Recipe missing nutritionPerServing must fail');

  const partialNutRes = validateAiRecipe(
    {
      ...validSample,
      name: 'Partial Nutrition Dish',
      nutritionPerServing: { calories: 220, protein: 14 },
    },
    INGREDIENTS,
    { diet: 'veg', mealType: 'dinner', allergies: [] }
  );
  console.assert(
    partialNutRes.valid === true && partialNutRes.recipe.nutritionPerServing.iron === null,
    'Missing minor nutrition field must fill with null, never 0'
  );

  // 7. parseAiRecipeTips valid and invalid inputs
  const validTips = parseAiRecipeTips(
    JSON.stringify({
      proTips: ['Rinse rice until water runs clear.', 'Rest 5 minutes covered before fluffing.'],
      substitutions: [
        {
          ingredient: 'Paneer',
          substitute: 'Firm tofu',
          reason: 'Press dry first for similar pan-seared texture.',
        },
      ],
    })
  );
  console.assert(
    validTips.ok === true &&
      validTips.proTips.length === 2 &&
      validTips.substitutions.length === 1 &&
      validTips.substitutions[0].substitute === 'Firm tofu',
    'parseAiRecipeTips should normalize valid proTips and substitutions'
  );

  const emptyTips = parseAiRecipeTips(JSON.stringify({ proTips: [], substitutions: [] }));
  console.assert(emptyTips.ok === false, 'Empty tips object must fail validation');

  // 8. matchSavedAiRecipes ignores staples and requires a selected main ingredient
  const staplesOnlyAi = matchSavedAiRecipes([validSample], {
    diet: 'veg',
    mealType: 'dinner',
    allergies: [],
    availableIngredientIds: ['salt'],
  });
  console.assert(
    staplesOnlyAi.length === 0,
    'matchSavedAiRecipes must return empty when only staples are selected'
  );
  const partialMainAi = matchSavedAiRecipes([validSample], {
    diet: 'veg',
    mealType: 'dinner',
    allergies: [],
    availableIngredientIds: ['egg'],
  });
  console.assert(
    partialMainAi.length === 1 && partialMainAi[0].matchScore === 50,
    `Expected 50% score for 1 of 2 main ingredients (excluding salt), got ${partialMainAi[0]?.matchScore}`
  );
})();
