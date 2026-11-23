// Backup export/import serialization and strict validation helpers for "What Can I Cook?".
import { INGREDIENTS } from '../recipes.js';
import { MAX_AI_RECIPES, validateAiRecipe } from './aiRecipes.js';
import { GROCERY_AISLE_ORDER, normalizeStoreOrder } from './groceryUtils.js';

export const BACKUP_FORMAT_VERSION = 1;

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  'app',
  'version',
  'exportedAt',
  'household',
  'defaultDiet',
  'allergies',
  'favoriteRecipeIds',
  'cookedMeals',
  'groceryList',
  'plannedMeals',
  'wcic_ai_recipes',
  'wcic_prices',
  'wcic_settings',
  'wcic_leftovers',
  'wcic_pantry',
  'wcic_purchases',
  'wcic_households',
  'householdBundles',
]);

const ALLOWED_SETTINGS_KEYS = new Set([
  'showCost',
  'showVisuals',
  'showIngredientImages',
  'hiddenRecipeIds',
  'reminders',
  'storeOrder',
  'festival',
  'weeklyNutritionGoal',
]);

const VALID_DIETS = new Set(['veg', 'nonveg']);
const VALID_AGE_GROUPS = new Set(['toddler', 'child', 'teen']);
const VALID_ALLERGIES = new Set(['dairy', 'gluten', 'nut', 'soy', 'egg']);
const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'snacks', 'dinner']);
const VALID_CATEGORIES = new Set([
  'vegetables',
  'fruits',
  'meat_fish',
  'eggs_dairy',
  'grains_pulses',
  'spices_herbs',
  'pantry',
]);
const VALID_PLAN_STATUSES = new Set(['planned', 'cooked', 'skipped']);
const VALID_FESTIVALS = new Set(['diwali', 'eid', 'pongal']);

const DEFAULT_REMINDERS = {
  breakfast: { enabled: false, time: '08:30' },
  lunch: { enabled: false, time: '13:00' },
  dinner: { enabled: false, time: '20:00' },
  water: { enabled: false },
};

function isValidTimeHHMM(val) {
  if (typeof val !== 'string' || !/^\d{2}:\d{2}$/.test(val)) return false;
  const [hh, mm] = val.split(':').map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function normalizeSettingsForExport(s = {}) {
  const rem = s?.reminders || {};
  return {
    showCost: typeof s?.showCost === 'boolean' ? s.showCost : true,
    showVisuals: typeof s?.showVisuals === 'boolean' ? s.showVisuals : true,
    showIngredientImages:
      typeof s?.showIngredientImages === 'boolean' ? s.showIngredientImages : true,
    hiddenRecipeIds: Array.isArray(s?.hiddenRecipeIds) ? [...s.hiddenRecipeIds] : [],
    reminders: {
      breakfast: {
        enabled: Boolean(rem?.breakfast?.enabled),
        time: isValidTimeHHMM(rem?.breakfast?.time) ? rem.breakfast.time : '08:30',
      },
      lunch: {
        enabled: Boolean(rem?.lunch?.enabled),
        time: isValidTimeHHMM(rem?.lunch?.time) ? rem.lunch.time : '13:00',
      },
      dinner: {
        enabled: Boolean(rem?.dinner?.enabled),
        time: isValidTimeHHMM(rem?.dinner?.time) ? rem.dinner.time : '20:00',
      },
      water: { enabled: Boolean(rem?.water?.enabled) },
    },
    storeOrder: normalizeStoreOrder(s?.storeOrder),
    festival:
      s?.festival &&
      VALID_FESTIVALS.has(s.festival.id) &&
      typeof s.festival.selectedAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.festival.selectedAt)
        ? { id: s.festival.id, selectedAt: s.festival.selectedAt }
        : null,
    weeklyNutritionGoal:
      s?.weeklyNutritionGoal &&
      typeof s.weeklyNutritionGoal === 'object' &&
      typeof s.weeklyNutritionGoal.minCalories === 'number' &&
      Number.isFinite(s.weeklyNutritionGoal.minCalories) &&
      s.weeklyNutritionGoal.minCalories > 0 &&
      typeof s.weeklyNutritionGoal.maxCalories === 'number' &&
      Number.isFinite(s.weeklyNutritionGoal.maxCalories) &&
      s.weeklyNutritionGoal.maxCalories >= s.weeklyNutritionGoal.minCalories
        ? {
            minCalories: Math.round(s.weeklyNutritionGoal.minCalories),
            maxCalories: Math.round(s.weeklyNutritionGoal.maxCalories),
            proteinGrams:
              typeof s.weeklyNutritionGoal.proteinGrams === 'number' &&
              Number.isFinite(s.weeklyNutritionGoal.proteinGrams) &&
              s.weeklyNutritionGoal.proteinGrams > 0
                ? Math.round(s.weeklyNutritionGoal.proteinGrams)
                : null,
            scope: s.weeklyNutritionGoal.scope === 'household' ? 'household' : 'perServing',
          }
        : null,
  };
}

function serializeSingleBundle(state) {
  return {
    household: {
      adults: Number(state?.household?.adults) || 1,
      children: Array.isArray(state?.household?.children)
        ? state.household.children.map((c) => ({ ageGroup: c?.ageGroup || 'child' }))
        : [],
    },
    defaultDiet: state?.defaultDiet === 'nonveg' ? 'nonveg' : 'veg',
    allergies: Array.isArray(state?.allergies) ? [...state.allergies] : [],
    favoriteRecipeIds: Array.isArray(state?.favoriteRecipeIds) ? [...state.favoriteRecipeIds] : [],
    cookedMeals: Array.isArray(state?.cookedMeals) ? [...state.cookedMeals] : [],
    groceryList: Array.isArray(state?.groceryList) ? [...state.groceryList] : [],
    plannedMeals: Array.isArray(state?.plannedMeals) ? [...state.plannedMeals] : [],
    wcic_ai_recipes: Array.isArray(state?.wcic_ai_recipes)
      ? state.wcic_ai_recipes.slice(-MAX_AI_RECIPES)
      : [],
    wcic_prices:
      state?.wcic_prices &&
      typeof state.wcic_prices === 'object' &&
      !Array.isArray(state.wcic_prices)
        ? { ...state.wcic_prices }
        : {},
    wcic_settings: normalizeSettingsForExport(state?.wcic_settings),
    wcic_leftovers: Array.isArray(state?.wcic_leftovers) ? [...state.wcic_leftovers] : [],
    wcic_pantry: Array.isArray(state?.wcic_pantry) ? [...state.wcic_pantry] : [],
    wcic_purchases: Array.isArray(state?.wcic_purchases) ? [...state.wcic_purchases] : [],
  };
}

/**
 * Build a complete backup payload (version 1) for JSON export of the active household.
 */
export function createBackupPayload(state) {
  return {
    app: 'What Can I Cook?',
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    ...serializeSingleBundle(state),
  };
}

/**
 * Build an all-households backup payload (version 1) containing wcic_households
 * plus per-household bundles alongside top-level active household fields.
 */
export function createAllHouseholdsBackupPayload({
  registry,
  activeState,
  bundlesById = {},
}) {
  const cleanBundles = {};
  for (const h of registry?.households || []) {
    const bundle = bundlesById[h.id];
    if (bundle) {
      cleanBundles[h.id] = serializeSingleBundle(bundle);
    }
  }
  return {
    ...createBackupPayload(activeState),
    wcic_households: {
      activeId: registry?.activeId || 'home',
      households: (registry?.households || []).map((h) => ({ id: h.id, name: h.name })),
    },
    householdBundles: cleanBundles,
  };
}

function validateBundleSection(raw, prefix = '') {
  const labelPrefix = prefix ? `[${prefix}] ` : '';

  if (!raw.household || typeof raw.household !== 'object' || Array.isArray(raw.household)) {
    return { ok: false, error: `${labelPrefix}Missing or invalid "household" section in backup file.` };
  }
  const { adults, children } = raw.household;
  if (typeof adults !== 'number' || !Number.isInteger(adults) || adults < 1 || adults > 20) {
    return { ok: false, error: `${labelPrefix}Household adults must be a whole number between 1 and 20.` };
  }
  if (!Array.isArray(children) || children.length > 20) {
    return { ok: false, error: `${labelPrefix}Household children must be a list of up to 20 entries.` };
  }
  const cleanChildren = [];
  for (let i = 0; i < children.length; i += 1) {
    const c = children[i];
    if (!c || typeof c !== 'object' || Array.isArray(c) || !VALID_AGE_GROUPS.has(c.ageGroup)) {
      return { ok: false, error: `${labelPrefix}Child entry #${i + 1} has an invalid age group.` };
    }
    cleanChildren.push({ ageGroup: c.ageGroup });
  }

  if (!VALID_DIETS.has(raw.defaultDiet)) {
    return { ok: false, error: `${labelPrefix}Missing or invalid "defaultDiet" (expected "veg" or "nonveg").` };
  }

  if (!Array.isArray(raw.allergies)) {
    return { ok: false, error: `${labelPrefix}Missing or invalid "allergies" list in backup file.` };
  }
  const cleanAllergies = [];
  for (const a of raw.allergies) {
    if (typeof a !== 'string' || !VALID_ALLERGIES.has(a)) {
      return { ok: false, error: `${labelPrefix}Unknown allergy value "${String(a)}" in backup file.` };
    }
    if (!cleanAllergies.includes(a)) cleanAllergies.push(a);
  }

  if (!Array.isArray(raw.favoriteRecipeIds)) {
    return { ok: false, error: `${labelPrefix}Missing or invalid "favoriteRecipeIds" list in backup file.` };
  }
  const cleanFavorites = [];
  for (const id of raw.favoriteRecipeIds) {
    if (typeof id !== 'string' || id.trim().length === 0) {
      return { ok: false, error: `${labelPrefix}Favorite recipe IDs must be non-empty strings.` };
    }
    if (!cleanFavorites.includes(id)) cleanFavorites.push(id);
  }

  if (!Array.isArray(raw.cookedMeals)) {
    return { ok: false, error: `${labelPrefix}Missing or invalid "cookedMeals" list in backup file.` };
  }
  const cleanMeals = [];
  for (let i = 0; i < raw.cookedMeals.length; i += 1) {
    const m = raw.cookedMeals[i];
    if (!m || typeof m !== 'object' || Array.isArray(m)) {
      return { ok: false, error: `${labelPrefix}Cooked meal #${i + 1} is not a valid object.` };
    }
    if (
      typeof m.id !== 'string' ||
      !m.id.trim() ||
      typeof m.recipeId !== 'string' ||
      !m.recipeId.trim() ||
      typeof m.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(m.date) ||
      typeof m.time !== 'string' ||
      !/^\d{2}:\d{2}$/.test(m.time) ||
      !VALID_MEAL_TYPES.has(m.mealType) ||
      !VALID_DIETS.has(m.diet) ||
      typeof m.servings !== 'number' ||
      Number.isNaN(m.servings) ||
      m.servings <= 0 ||
      (m.note !== undefined && typeof m.note !== 'string') ||
      (m.rating !== undefined &&
        (typeof m.rating !== 'number' || Number.isNaN(m.rating) || m.rating < 1 || m.rating > 5)) ||
      (m.recipeName !== undefined && typeof m.recipeName !== 'string')
    ) {
      return {
        ok: false,
        error: `${labelPrefix}Cooked meal #${i + 1} is missing required fields or has invalid format.`,
      };
    }
    cleanMeals.push({ ...m });
  }

  const cleanGrocery = [];
  if (raw.groceryList !== undefined) {
    if (!Array.isArray(raw.groceryList)) {
      return { ok: false, error: `${labelPrefix}Invalid "groceryList" format in backup file.` };
    }
    for (let i = 0; i < raw.groceryList.length; i += 1) {
      const g = raw.groceryList[i];
      if (!g || typeof g !== 'object' || Array.isArray(g)) {
        return { ok: false, error: `${labelPrefix}Grocery item #${i + 1} is not a valid object.` };
      }
      if (
        typeof g.id !== 'string' ||
        !g.id.trim() ||
        typeof g.name !== 'string' ||
        !g.name.trim() ||
        typeof g.ingredientId !== 'string' ||
        !g.ingredientId.trim() ||
        !VALID_CATEGORIES.has(g.category) ||
        typeof g.quantityText !== 'string' ||
        typeof g.checked !== 'boolean' ||
        !Array.isArray(g.fromRecipeIds) ||
        !g.fromRecipeIds.every((rid) => typeof rid === 'string' && rid.trim().length > 0)
      ) {
        return {
          ok: false,
          error: `${labelPrefix}Grocery item #${i + 1} is missing required fields or has invalid format.`,
        };
      }
      cleanGrocery.push({ ...g, fromRecipeIds: [...g.fromRecipeIds] });
    }
  }

  const cleanPlanned = [];
  if (raw.plannedMeals !== undefined) {
    if (!Array.isArray(raw.plannedMeals)) {
      return { ok: false, error: `${labelPrefix}Invalid "plannedMeals" format in backup file.` };
    }
    for (let i = 0; i < raw.plannedMeals.length; i += 1) {
      const p = raw.plannedMeals[i];
      if (!p || typeof p !== 'object' || Array.isArray(p)) {
        return { ok: false, error: `${labelPrefix}Planned meal #${i + 1} is not a valid object.` };
      }
      if (
        typeof p.id !== 'string' ||
        !p.id.trim() ||
        typeof p.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
        !VALID_MEAL_TYPES.has(p.mealType) ||
        typeof p.recipeId !== 'string' ||
        !p.recipeId.trim() ||
        !VALID_PLAN_STATUSES.has(p.status) ||
        typeof p.servings !== 'number' ||
        Number.isNaN(p.servings) ||
        p.servings <= 0 ||
        (p.note !== undefined && typeof p.note !== 'string')
      ) {
        return {
          ok: false,
          error: `${labelPrefix}Planned meal #${i + 1} is missing required fields or has invalid format.`,
        };
      }
      cleanPlanned.push({ ...p });
    }
  }

  const cleanAiRecipes = [];
  if (raw.wcic_ai_recipes !== undefined) {
    if (!Array.isArray(raw.wcic_ai_recipes)) {
      return { ok: false, error: `${labelPrefix}Invalid "wcic_ai_recipes" format in backup file.` };
    }
    for (let i = 0; i < raw.wcic_ai_recipes.length; i += 1) {
      const check = validateAiRecipe(raw.wcic_ai_recipes[i], INGREDIENTS, {});
      if (!check.valid) {
        return {
          ok: false,
          error: `${labelPrefix}AI recipe #${i + 1} is invalid: ${check.reason}`,
        };
      }
      cleanAiRecipes.push(check.recipe);
    }
  }

  const cleanPrices = {};
  if (raw.wcic_prices !== undefined) {
    if (!raw.wcic_prices || typeof raw.wcic_prices !== 'object' || Array.isArray(raw.wcic_prices)) {
      return { ok: false, error: `${labelPrefix}Invalid "wcic_prices" format in backup file.` };
    }
    for (const [id, entry] of Object.entries(raw.wcic_prices)) {
      if (!id || !id.trim()) {
        return { ok: false, error: `${labelPrefix}Invalid ingredient key in "wcic_prices".` };
      }
      if (
        !entry ||
        typeof entry !== 'object' ||
        Array.isArray(entry) ||
        typeof entry.perUnitPaise !== 'number' ||
        !Number.isInteger(entry.perUnitPaise) ||
        entry.perUnitPaise <= 0 ||
        typeof entry.unit !== 'string' ||
        entry.unit.trim().length === 0
      ) {
        return {
          ok: false,
          error: `${labelPrefix}Price entry for "${id}" must have a positive integer perUnitPaise and unit.`,
        };
      }
      cleanPrices[id] = { perUnitPaise: entry.perUnitPaise, unit: entry.unit.trim() };
    }
  }

  let cleanSettings = {
    showCost: true,
    showVisuals: true,
    showIngredientImages: true,
    hiddenRecipeIds: [],
    reminders: { ...DEFAULT_REMINDERS },
    storeOrder: [...GROCERY_AISLE_ORDER],
    festival: null,
    weeklyNutritionGoal: null,
  };
  if (raw.wcic_settings !== undefined) {
    const s = raw.wcic_settings;
    if (
      !s ||
      typeof s !== 'object' ||
      Array.isArray(s) ||
      typeof s.showCost !== 'boolean' ||
      typeof s.showVisuals !== 'boolean' ||
      (s.showIngredientImages !== undefined && typeof s.showIngredientImages !== 'boolean')
    ) {
      return { ok: false, error: `${labelPrefix}Invalid "wcic_settings" format in backup file.` };
    }
    for (const skey of Object.keys(s)) {
      if (!ALLOWED_SETTINGS_KEYS.has(skey)) {
        return { ok: false, error: `${labelPrefix}Unexpected setting "${skey}" in "wcic_settings".` };
      }
    }
    if (s.hiddenRecipeIds !== undefined) {
      if (
        !Array.isArray(s.hiddenRecipeIds) ||
        !s.hiddenRecipeIds.every((id) => typeof id === 'string' && id.trim().length > 0)
      ) {
        return { ok: false, error: `${labelPrefix}Invalid "hiddenRecipeIds" in "wcic_settings".` };
      }
    }
    if (s.storeOrder !== undefined) {
      if (
        !Array.isArray(s.storeOrder) ||
        !s.storeOrder.every((cat) => typeof cat === 'string' && VALID_CATEGORIES.has(cat))
      ) {
        return { ok: false, error: `${labelPrefix}Invalid "storeOrder" category list in "wcic_settings".` };
      }
    }
    if (s.reminders !== undefined) {
      if (!s.reminders || typeof s.reminders !== 'object' || Array.isArray(s.reminders)) {
        return { ok: false, error: `${labelPrefix}Invalid "reminders" in "wcic_settings".` };
      }
      for (const mk of ['breakfast', 'lunch', 'dinner']) {
        if (s.reminders[mk] !== undefined) {
          const slot = s.reminders[mk];
          if (
            !slot ||
            typeof slot !== 'object' ||
            typeof slot.enabled !== 'boolean' ||
            !isValidTimeHHMM(slot.time)
          ) {
            return {
              ok: false,
              error: `${labelPrefix}Reminder "${mk}" must include enabled boolean and valid HH:mm time.`,
            };
          }
        }
      }
      if (
        s.reminders.water !== undefined &&
        (!s.reminders.water || typeof s.reminders.water.enabled !== 'boolean')
      ) {
        return { ok: false, error: `${labelPrefix}Water reminder must include enabled boolean.` };
      }
    }
    if (s.festival !== undefined && s.festival !== null) {
      const f = s.festival;
      if (
        !f ||
        typeof f !== 'object' ||
        Array.isArray(f) ||
        !VALID_FESTIVALS.has(f.id) ||
        typeof f.selectedAt !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(f.selectedAt)
      ) {
        return { ok: false, error: `${labelPrefix}Invalid "festival" in "wcic_settings".` };
      }
    }
    if (s.weeklyNutritionGoal !== undefined && s.weeklyNutritionGoal !== null) {
      const g = s.weeklyNutritionGoal;
      if (
        !g ||
        typeof g !== 'object' ||
        Array.isArray(g) ||
        typeof g.minCalories !== 'number' ||
        !Number.isFinite(g.minCalories) ||
        g.minCalories <= 0 ||
        typeof g.maxCalories !== 'number' ||
        !Number.isFinite(g.maxCalories) ||
        g.maxCalories < g.minCalories ||
        (g.proteinGrams !== undefined &&
          g.proteinGrams !== null &&
          (typeof g.proteinGrams !== 'number' ||
            !Number.isFinite(g.proteinGrams) ||
            g.proteinGrams <= 0)) ||
        (g.scope !== undefined && g.scope !== 'perServing' && g.scope !== 'household')
      ) {
        return {
          ok: false,
          error: `${labelPrefix}Invalid "weeklyNutritionGoal" in "wcic_settings".`,
        };
      }
    }
    cleanSettings = normalizeSettingsForExport(s);
  }

  // Validate wcic_leftovers (if present)
  const cleanLeftovers = [];
  if (raw.wcic_leftovers !== undefined) {
    if (!Array.isArray(raw.wcic_leftovers)) {
      return { ok: false, error: `${labelPrefix}Invalid "wcic_leftovers" format in backup file.` };
    }
    for (let i = 0; i < raw.wcic_leftovers.length; i += 1) {
      const lo = raw.wcic_leftovers[i];
      if (
        !lo ||
        typeof lo !== 'object' ||
        Array.isArray(lo) ||
        typeof lo.id !== 'string' ||
        !lo.id.trim() ||
        typeof lo.recipeId !== 'string' ||
        !lo.recipeId.trim() ||
        typeof lo.portions !== 'number' ||
        !Number.isFinite(lo.portions) ||
        lo.portions < 0 ||
        typeof lo.cookedDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(lo.cookedDate) ||
        typeof lo.keepUntil !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(lo.keepUntil) ||
        typeof lo.usedUp !== 'boolean'
      ) {
        return {
          ok: false,
          error: `${labelPrefix}Leftover entry #${i + 1} has invalid fields.`,
        };
      }
      cleanLeftovers.push({ ...lo });
    }
  }

  // Validate wcic_pantry (if present)
  const cleanPantry = [];
  if (raw.wcic_pantry !== undefined) {
    if (!Array.isArray(raw.wcic_pantry)) {
      return { ok: false, error: `${labelPrefix}Invalid "wcic_pantry" format in backup file.` };
    }
    for (let i = 0; i < raw.wcic_pantry.length; i += 1) {
      const p = raw.wcic_pantry[i];
      if (
        !p ||
        typeof p !== 'object' ||
        Array.isArray(p) ||
        typeof p.ingredientId !== 'string' ||
        !p.ingredientId.trim() ||
        typeof p.boughtOn !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(p.boughtOn)
      ) {
        return {
          ok: false,
          error: `${labelPrefix}Pantry date entry #${i + 1} must have ingredientId and YYYY-MM-DD boughtOn.`,
        };
      }
      cleanPantry.push({ ingredientId: p.ingredientId.trim(), boughtOn: p.boughtOn });
    }
  }

  // Validate wcic_purchases (if present)
  const cleanPurchases = [];
  if (raw.wcic_purchases !== undefined) {
    if (!Array.isArray(raw.wcic_purchases)) {
      return { ok: false, error: `${labelPrefix}Invalid "wcic_purchases" format in backup file.` };
    }
    for (let i = 0; i < raw.wcic_purchases.length; i += 1) {
      const pr = raw.wcic_purchases[i];
      if (
        !pr ||
        typeof pr !== 'object' ||
        Array.isArray(pr) ||
        typeof pr.id !== 'string' ||
        !pr.id.trim() ||
        typeof pr.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(pr.date) ||
        typeof pr.totalPaise !== 'number' ||
        !Number.isFinite(pr.totalPaise) ||
        pr.totalPaise < 0 ||
        typeof pr.itemCount !== 'number' ||
        !Number.isFinite(pr.itemCount) ||
        pr.itemCount < 0
      ) {
        return {
          ok: false,
          error: `${labelPrefix}Purchase record #${i + 1} has invalid fields.`,
        };
      }
      cleanPurchases.push({ ...pr });
    }
  }

  return {
    ok: true,
    bundle: {
      household: { adults, children: cleanChildren },
      defaultDiet: raw.defaultDiet,
      allergies: cleanAllergies,
      favoriteRecipeIds: cleanFavorites,
      cookedMeals: cleanMeals,
      groceryList: cleanGrocery,
      plannedMeals: cleanPlanned,
      wcic_ai_recipes: cleanAiRecipes.slice(-MAX_AI_RECIPES),
      wcic_prices: cleanPrices,
      wcic_settings: cleanSettings,
      wcic_leftovers: cleanLeftovers,
      wcic_pantry: cleanPantry,
      wcic_purchases: cleanPurchases,
    },
  };
}

/**
 * Strictly validate an imported JSON object before overwriting any localStorage data.
 */
export function validateBackupData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Backup file must contain a valid JSON object.' };
  }

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      return {
        ok: false,
        error: `Unexpected section "${key}" in backup file.`,
      };
    }
  }

  if (raw.version === undefined || raw.version === null) {
    return { ok: false, error: 'Missing version field in backup file.' };
  }
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1) {
    return { ok: false, error: 'Invalid backup version format.' };
  }
  if (raw.version > BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      error: `This backup uses a newer format (version ${raw.version}) that this version of the app cannot read.`,
    };
  }
  if (raw.app !== undefined && typeof raw.app !== 'string') {
    return { ok: false, error: 'Invalid "app" field type in backup file.' };
  }
  if (raw.exportedAt !== undefined && typeof raw.exportedAt !== 'string') {
    return { ok: false, error: 'Invalid "exportedAt" field type in backup file.' };
  }

  const mainBundleRes = validateBundleSection(raw);
  if (!mainBundleRes.ok) {
    return mainBundleRes;
  }

  let cleanRegistry = undefined;
  let cleanBundles = undefined;

  if (raw.wcic_households !== undefined) {
    const reg = raw.wcic_households;
    if (
      !reg ||
      typeof reg !== 'object' ||
      Array.isArray(reg) ||
      typeof reg.activeId !== 'string' ||
      !reg.activeId.trim() ||
      !Array.isArray(reg.households) ||
      reg.households.length === 0
    ) {
      return { ok: false, error: 'Invalid "wcic_households" registry in backup file.' };
    }
    const cleanHouseholds = [];
    for (let i = 0; i < reg.households.length; i += 1) {
      const h = reg.households[i];
      if (
        !h ||
        typeof h !== 'object' ||
        typeof h.id !== 'string' ||
        !h.id.trim() ||
        typeof h.name !== 'string' ||
        !h.name.trim()
      ) {
        return { ok: false, error: `Household entry #${i + 1} in registry is invalid.` };
      }
      cleanHouseholds.push({ id: h.id.trim(), name: h.name.trim() });
    }
    cleanRegistry = {
      activeId: reg.activeId.trim(),
      households: cleanHouseholds,
    };
  }

  if (raw.householdBundles !== undefined) {
    if (
      !raw.householdBundles ||
      typeof raw.householdBundles !== 'object' ||
      Array.isArray(raw.householdBundles)
    ) {
      return { ok: false, error: 'Invalid "householdBundles" section in backup file.' };
    }
    cleanBundles = {};
    for (const [hid, bundleObj] of Object.entries(raw.householdBundles)) {
      if (!hid || !hid.trim()) {
        return { ok: false, error: 'Household bundle id must be non-empty string.' };
      }
      const bRes = validateBundleSection(bundleObj, hid);
      if (!bRes.ok) return bRes;
      cleanBundles[hid] = bRes.bundle;
    }
  }

  return {
    ok: true,
    data: {
      ...mainBundleRes.bundle,
      ...(cleanRegistry ? { wcic_households: cleanRegistry } : {}),
      ...(cleanBundles ? { householdBundles: cleanBundles } : {}),
    },
  };
}

// Self-tests for the import/export validator
(function runSelfTests() {
  const validPayload = createBackupPayload({
    household: { adults: 2, children: [{ ageGroup: 'child' }] },
    defaultDiet: 'veg',
    allergies: ['dairy', 'egg'],
    favoriteRecipeIds: ['poha', 'idli'],
    cookedMeals: [
      {
        id: 'meal-1',
        recipeId: 'poha',
        date: '2026-11-17',
        time: '08:30',
        mealType: 'breakfast',
        diet: 'veg',
        servings: 2.75,
      },
    ],
    groceryList: [
      {
        id: 'onion__pcs',
        name: 'Onion',
        ingredientId: 'onion',
        category: 'vegetables',
        quantityText: '2 pcs',
        checked: false,
        fromRecipeIds: ['poha'],
      },
    ],
    plannedMeals: [
      {
        id: 'plan-1',
        date: '2026-11-18',
        mealType: 'dinner',
        recipeId: 'dal_tadka',
        status: 'planned',
        servings: 2.75,
      },
    ],
    wcic_ai_recipes: [
      {
        id: 'ai_quick_onion_egg',
        source: 'ai',
        name: 'Quick Masala Egg Fry',
        mealTypes: ['breakfast', 'dinner'],
        diet: 'veg',
        allergens: ['egg'],
        cuisine: 'Indian',
        difficulty: 'easy',
        prepMinutes: 5,
        cookMinutes: 8,
        baseServings: 1,
        ingredients: [
          { ingredientId: 'egg', amount: 2, unit: 'pcs', optional: false },
          { ingredientId: 'onion', amount: 1, unit: 'pcs', optional: false },
        ],
        steps: [{ text: 'Cook onions and fry eggs with salt.', timerSeconds: 180 }],
        nutritionPerServing: { calories: 230, protein: 14 },
        tags: ['quick'],
      },
    ],
    wcic_prices: {
      onion: { perUnitPaise: 800, unit: 'pcs' },
    },
    wcic_settings: {
      showCost: true,
      showVisuals: false,
      showIngredientImages: false,
      hiddenRecipeIds: ['upma'],
      reminders: {
        breakfast: { enabled: true, time: '08:15' },
        lunch: { enabled: false, time: '13:00' },
        dinner: { enabled: false, time: '20:00' },
        water: { enabled: true },
      },
      storeOrder: ['pantry', 'vegetables', 'fruits', 'eggs_dairy', 'meat_fish', 'grains_pulses', 'spices_herbs'],
      festival: { id: 'diwali', selectedAt: '2026-11-18' },
      weeklyNutritionGoal: { minCalories: 12600, maxCalories: 15400, proteinGrams: 350, scope: 'perServing' },
    },
    wcic_leftovers: [
      {
        id: 'lo-1',
        recipeId: 'dal_tadka',
        portions: 2,
        cookedDate: '2026-11-18',
        keepUntil: '2026-11-20',
        usedUp: false,
      },
    ],
    wcic_pantry: [{ ingredientId: 'spinach', boughtOn: '2026-11-18' }],
    wcic_purchases: [{ id: 'pur-1', date: '2026-11-18', totalPaise: 45000, itemCount: 7 }],
  });

  console.assert(validPayload.version === 1, 'Expected backup version 1');

  const validResult = validateBackupData(validPayload);
  console.assert(
    validResult.ok === true &&
      validResult.data.wcic_leftovers.length === 1 &&
      validResult.data.wcic_pantry.length === 1 &&
      validResult.data.wcic_purchases.length === 1 &&
      validResult.data.wcic_settings.hiddenRecipeIds[0] === 'upma' &&
      validResult.data.wcic_settings.festival?.id === 'diwali' &&
      validResult.data.wcic_settings.weeklyNutritionGoal?.minCalories === 12600,
    `Expected valid backup payload with all new keys to pass: ${JSON.stringify(validResult)}`
  );

  // All-households payload test
  const allPayload = createAllHouseholdsBackupPayload({
    registry: { activeId: 'home', households: [{ id: 'home', name: 'Home' }] },
    activeState: validPayload,
    bundlesById: { home: validPayload },
  });
  console.assert(validateBackupData(allPayload).ok === true, 'Expected all-households payload to validate');

  const missingVersion = { ...validPayload };
  delete missingVersion.version;
  console.assert(validateBackupData(missingVersion).ok === false, 'Expected missing version to fail');

  const newerRes = validateBackupData({ ...validPayload, version: 2 });
  console.assert(newerRes.ok === false && newerRes.error.includes('newer'), 'Expected v2 to fail');

  console.assert(
    validateBackupData({ ...validPayload, extraUnexpectedKey: 123 }).ok === false,
    'Expected unknown top-level key to fail'
  );

  console.assert(
    validateBackupData({
      ...validPayload,
      wcic_leftovers: [{ id: 'x', recipeId: 'poha', portions: -1, cookedDate: '2026-11-18', keepUntil: '2026-11-20', usedUp: false }],
    }).ok === false,
    'Expected invalid leftover portions to fail validation'
  );

  console.assert(
    validateBackupData({
      ...validPayload,
      wcic_pantry: [{ ingredientId: 'spinach', boughtOn: '18-11-2026' }],
    }).ok === false,
    'Expected invalid pantry date format to fail validation'
  );

  console.assert(
    validateBackupData({
      ...validPayload,
      wcic_purchases: [{ id: 'p1', date: '2026-11-18', totalPaise: -5, itemCount: 1 }],
    }).ok === false,
    'Expected negative purchase totalPaise to fail validation'
  );
})();
