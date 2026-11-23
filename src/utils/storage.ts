import { INGREDIENTS } from '../recipes.js';
import { MAX_AI_RECIPES, validateAiRecipe } from './aiRecipes.js';
import { GROCERY_AISLE_ORDER, normalizeStoreOrder } from './groceryUtils.js';
import {
  clearLegacyMigrationBackup,
  DEFAULT_HOUSEHOLD_ID,
  hasLegacyMigrationBackup,
  HOUSEHOLD_SCOPED_SPECS,
  householdStorageKey,
  migrateLegacyStorageIfNeeded,
  readRegistry,
  writeRegistry,
} from './households.js';
import {
  AllergyKey,
  CookedMeal,
  CookFlowSelection,
  DietType,
  FestivalSelection,
  GroceryItem,
  Household,
  IngredientCategory,
  LeftoverItem,
  PantryEntry,
  PlannedMeal,
  PriceMap,
  PurchaseRecord,
  Recipe,
  ReminderSettings,
  UserSettings,
  WcicHouseholdsRegistry,
  WcicSettings,
  WeeklyNutritionGoal,
} from '../types/cook';

const LEGACY_KEYS = {
  HOUSEHOLD: 'wcc_household_v1',
  DEFAULT_DIET: 'wcc_default_diet_v1',
  ALLERGIES: 'wcc_allergies_v1',
  FAVORITE_RECIPE_IDS: 'wcc_favorite_recipe_ids_v1',
  COOKED_MEALS: 'wcc_cooked_meals_v1',
  COOK_SELECTION: 'wcc_cook_selection_v1',
  GROCERY_LIST: 'wcc_grocery_list_v1',
  PLANNED_MEALS: 'wcc_planned_meals_v1',
  LEGACY_SETTINGS: 'wcc_user_settings_v1',
  LEGACY_AI_RECIPES: 'wcc_ai_recipes_v1',
  AI_RECIPES: 'wcic_ai_recipes',
  PRICES: 'wcic_prices',
  WCIC_SETTINGS: 'wcic_settings',
} as const;

const VALID_ALLERGIES = new Set<AllergyKey>([
  'dairy',
  'gluten',
  'nut',
  'soy',
  'egg',
]);

const VALID_AGE_GROUPS = new Set(['toddler', 'child', 'teen']);
const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'snacks', 'dinner']);
const VALID_FESTIVAL_IDS = new Set(['diwali', 'eid', 'pongal']);

export const DEFAULT_REMINDERS: ReminderSettings = {
  breakfast: { enabled: false, time: '08:30' },
  lunch: { enabled: false, time: '13:00' },
  dinner: { enabled: false, time: '20:00' },
  water: { enabled: false },
};

export function createDefaultWcicSettings(): WcicSettings {
  return {
    showCost: true,
    showVisuals: true,
    showIngredientImages: true,
    hiddenRecipeIds: [],
    reminders: {
      breakfast: { ...DEFAULT_REMINDERS.breakfast },
      lunch: { ...DEFAULT_REMINDERS.lunch },
      dinner: { ...DEFAULT_REMINDERS.dinner },
      water: { ...DEFAULT_REMINDERS.water },
    },
    storeOrder: [...GROCERY_AISLE_ORDER],
    festival: null,
    weeklyNutritionGoal: null,
  };
}

function getActiveId(explicitHouseholdId?: string): string {
  if (explicitHouseholdId && explicitHouseholdId.trim()) {
    return explicitHouseholdId.trim();
  }
  return readRegistry().activeId || DEFAULT_HOUSEHOLD_ID;
}

function scopedKey(suffix: string, householdId?: string): string {
  return householdStorageKey(getActiveId(householdId), suffix);
}

/**
 * Initialize households on app start and run idempotent legacy migration into "Home".
 */
export function initializeHouseholds(): WcicHouseholdsRegistry {
  return migrateLegacyStorageIfNeeded();
}

export function loadHouseholdsRegistry(): WcicHouseholdsRegistry {
  return readRegistry();
}

export function saveHouseholdsRegistry(registry: WcicHouseholdsRegistry): boolean {
  return writeRegistry(registry);
}

export function hasMigrationBackup(): boolean {
  return hasLegacyMigrationBackup();
}

export function dismissMigrationBackup(): void {
  clearLegacyMigrationBackup();
}

/**
 * Check whether browser localStorage can be read and written safely.
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const probeKey = '__wcc_storage_test__';
    window.localStorage.setItem(probeKey, '1');
    const val = window.localStorage.getItem(probeKey);
    window.localStorage.removeItem(probeKey);
    return val === '1';
  } catch {
    return false;
  }
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Failed reading localStorage key "${key}":`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`Failed writing localStorage key "${key}":`, err);
    return false;
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Failed removing localStorage key "${key}":`, err);
  }
}

/**
 * Load household configuration from localStorage with safe fallback.
 */
export function loadHousehold(householdId?: string): Household | null {
  const hid = getActiveId(householdId);
  const key = scopedKey('household', hid);
  let data = safeGet<Household | null>(key, null);
  if (!data && hid === DEFAULT_HOUSEHOLD_ID) {
    data = safeGet<Household | null>(LEGACY_KEYS.HOUSEHOLD, null);
  }
  if (!data || typeof data.adults !== 'number' || Number.isNaN(data.adults) || data.adults < 1) {
    return null;
  }
  const children = Array.isArray(data.children)
    ? data.children
        .filter((c) => c && typeof c === 'object')
        .slice(0, 20)
        .map((c) => ({
          ageGroup: VALID_AGE_GROUPS.has(c.ageGroup) ? c.ageGroup : ('child' as const),
        }))
    : [];
  return {
    adults: Math.min(20, Math.max(1, Math.round(data.adults))),
    children,
  };
}

/**
 * Persist household configuration to localStorage.
 */
export function saveHousehold(household: Household, householdId?: string): boolean {
  return safeSet(scopedKey('household', householdId), household);
}

/**
 * Load default diet ("veg" | "nonveg") for the active household.
 */
export function loadDefaultDiet(householdId?: string): DietType {
  const hid = getActiveId(householdId);
  const dedicated = safeGet<unknown>(scopedKey('default_diet', hid), null);
  if (dedicated === 'veg' || dedicated === 'nonveg') {
    return dedicated;
  }
  if (hid === DEFAULT_HOUSEHOLD_ID) {
    const legacyDed = safeGet<unknown>(LEGACY_KEYS.DEFAULT_DIET, null);
    if (legacyDed === 'veg' || legacyDed === 'nonveg') return legacyDed;
    const legacy = safeGet<Partial<UserSettings> | null>(LEGACY_KEYS.LEGACY_SETTINGS, null);
    return legacy?.defaultDiet === 'nonveg' ? 'nonveg' : 'veg';
  }
  return 'veg';
}

export function saveDefaultDiet(diet: DietType, householdId?: string): boolean {
  return safeSet(scopedKey('default_diet', householdId), diet);
}

/**
 * Load saved allergy filter list for the active household.
 */
export function loadAllergies(householdId?: string): AllergyKey[] {
  const hid = getActiveId(householdId);
  const dedicated = safeGet<unknown>(scopedKey('allergies', hid), null);
  let rawList = Array.isArray(dedicated) ? dedicated : null;
  if (!rawList && hid === DEFAULT_HOUSEHOLD_ID) {
    const legacyDed = safeGet<unknown>(LEGACY_KEYS.ALLERGIES, null);
    rawList = Array.isArray(legacyDed)
      ? legacyDed
      : safeGet<Partial<UserSettings> | null>(LEGACY_KEYS.LEGACY_SETTINGS, null)?.allergies || null;
  }
  if (!Array.isArray(rawList)) return [];
  return Array.from(
    new Set(
      rawList.filter(
        (item): item is AllergyKey =>
          typeof item === 'string' && VALID_ALLERGIES.has(item as AllergyKey)
      )
    )
  );
}

export function saveAllergies(allergies: AllergyKey[], householdId?: string): boolean {
  return safeSet(scopedKey('allergies', householdId), allergies);
}

/**
 * Load saved favorite recipe IDs for the active household.
 */
export function loadFavoriteRecipeIds(householdId?: string): string[] {
  const hid = getActiveId(householdId);
  const dedicated = safeGet<unknown>(scopedKey('favorite_recipe_ids', hid), null);
  let rawList = Array.isArray(dedicated) ? dedicated : null;
  if (!rawList && hid === DEFAULT_HOUSEHOLD_ID) {
    const legacyDed = safeGet<unknown>(LEGACY_KEYS.FAVORITE_RECIPE_IDS, null);
    rawList = Array.isArray(legacyDed)
      ? legacyDed
      : safeGet<Partial<UserSettings> | null>(LEGACY_KEYS.LEGACY_SETTINGS, null)?.favorites || null;
  }
  if (!Array.isArray(rawList)) return [];
  return Array.from(
    new Set(rawList.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
  );
}

export function saveFavoriteRecipeIds(ids: string[], householdId?: string): boolean {
  return safeSet(scopedKey('favorite_recipe_ids', householdId), ids);
}

/**
 * Load cooked meals history from localStorage, filtering out any corrupted entries.
 */
export function loadCookedMeals(householdId?: string): CookedMeal[] {
  const hid = getActiveId(householdId);
  let list = safeGet<unknown>(scopedKey('cooked_meals', hid), null);
  if (list === null && hid === DEFAULT_HOUSEHOLD_ID) {
    list = safeGet<unknown>(LEGACY_KEYS.COOKED_MEALS, []);
  }
  if (!Array.isArray(list)) return [];

  return list.filter((item): item is CookedMeal => {
    if (!item || typeof item !== 'object') return false;
    const m = item as Partial<CookedMeal>;
    return (
      typeof m.id === 'string' &&
      m.id.trim().length > 0 &&
      typeof m.recipeId === 'string' &&
      m.recipeId.trim().length > 0 &&
      typeof m.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(m.date) &&
      typeof m.time === 'string' &&
      /^\d{2}:\d{2}$/.test(m.time) &&
      typeof m.mealType === 'string' &&
      VALID_MEAL_TYPES.has(m.mealType) &&
      (m.diet === 'veg' || m.diet === 'nonveg') &&
      typeof m.servings === 'number' &&
      !Number.isNaN(m.servings) &&
      m.servings > 0
    );
  });
}

export function saveCookedMeals(meals: CookedMeal[], householdId?: string): boolean {
  return safeSet(scopedKey('cooked_meals', householdId), meals);
}

/**
 * Load Cook flow selection state from localStorage with strict field validation.
 */
export function loadCookSelection(
  defaultSelection: CookFlowSelection,
  householdId?: string
): CookFlowSelection {
  const hid = getActiveId(householdId);
  let saved = safeGet<Partial<CookFlowSelection> | null>(scopedKey('cook_selection', hid), null);
  if (!saved && hid === DEFAULT_HOUSEHOLD_ID) {
    saved = safeGet<Partial<CookFlowSelection> | null>(LEGACY_KEYS.COOK_SELECTION, null);
  }
  if (!saved || typeof saved !== 'object') return defaultSelection;

  const validStep =
    saved.lastStep === 1 ||
    saved.lastStep === 2 ||
    saved.lastStep === 3 ||
    saved.lastStep === 4
      ? saved.lastStep
      : defaultSelection.lastStep;

  return {
    diet: saved.diet === 'nonveg' ? 'nonveg' : saved.diet === 'veg' ? 'veg' : defaultSelection.diet,
    mealType:
      typeof saved.mealType === 'string' && VALID_MEAL_TYPES.has(saved.mealType)
        ? saved.mealType
        : defaultSelection.mealType,
    selectedIngredientIds: Array.isArray(saved.selectedIngredientIds)
      ? saved.selectedIngredientIds.filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0
        )
      : defaultSelection.selectedIngredientIds,
    customIngredients: Array.isArray(saved.customIngredients)
      ? saved.customIngredients.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0
        )
      : [],
    lastStep: validStep,
  };
}

export function saveCookSelection(selection: CookFlowSelection, householdId?: string): boolean {
  return safeSet(scopedKey('cook_selection', householdId), selection);
}

const VALID_CATEGORIES = new Set([
  'vegetables',
  'fruits',
  'meat_fish',
  'eggs_dairy',
  'grains_pulses',
  'spices_herbs',
  'pantry',
]);

/**
 * Load grocery list from localStorage, filtering out any corrupted entries.
 */
export function loadGroceryList(householdId?: string): GroceryItem[] {
  const hid = getActiveId(householdId);
  let list = safeGet<unknown>(scopedKey('grocery_list', hid), null);
  if (list === null && hid === DEFAULT_HOUSEHOLD_ID) {
    list = safeGet<unknown>(LEGACY_KEYS.GROCERY_LIST, []);
  }
  if (!Array.isArray(list)) return [];

  return list
    .filter((item): item is GroceryItem => {
      if (!item || typeof item !== 'object') return false;
      const g = item as Partial<GroceryItem>;
      return (
        typeof g.id === 'string' &&
        g.id.trim().length > 0 &&
        typeof g.name === 'string' &&
        g.name.trim().length > 0 &&
        typeof g.ingredientId === 'string' &&
        g.ingredientId.trim().length > 0 &&
        typeof g.category === 'string' &&
        VALID_CATEGORIES.has(g.category) &&
        typeof g.quantityText === 'string' &&
        typeof g.checked === 'boolean' &&
        Array.isArray(g.fromRecipeIds)
      );
    })
    .map((g) => ({
      ...g,
      fromRecipeIds: g.fromRecipeIds.filter(
        (rid): rid is string => typeof rid === 'string' && rid.trim().length > 0
      ),
    }));
}

export function saveGroceryList(items: GroceryItem[], householdId?: string): boolean {
  return safeSet(scopedKey('grocery_list', householdId), items);
}

const VALID_PLAN_STATUSES = new Set(['planned', 'cooked', 'skipped']);

/**
 * Load planned meals from localStorage, filtering out any corrupted entries.
 */
export function loadPlannedMeals(householdId?: string): PlannedMeal[] {
  const hid = getActiveId(householdId);
  let list = safeGet<unknown>(scopedKey('planned_meals', hid), null);
  if (list === null && hid === DEFAULT_HOUSEHOLD_ID) {
    list = safeGet<unknown>(LEGACY_KEYS.PLANNED_MEALS, []);
  }
  if (!Array.isArray(list)) return [];

  return list.filter((item): item is PlannedMeal => {
    if (!item || typeof item !== 'object') return false;
    const p = item as Partial<PlannedMeal>;
    return (
      typeof p.id === 'string' &&
      p.id.trim().length > 0 &&
      typeof p.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(p.date) &&
      typeof p.mealType === 'string' &&
      VALID_MEAL_TYPES.has(p.mealType) &&
      typeof p.recipeId === 'string' &&
      p.recipeId.trim().length > 0 &&
      typeof p.status === 'string' &&
      VALID_PLAN_STATUSES.has(p.status) &&
      typeof p.servings === 'number' &&
      !Number.isNaN(p.servings) &&
      p.servings > 0
    );
  });
}

export function savePlannedMeals(items: PlannedMeal[], householdId?: string): boolean {
  return safeSet(scopedKey('planned_meals', householdId), items);
}

let corruptedWcicRecovered = false;

export function hadCorruptedWcicRecovery(): boolean {
  return corruptedWcicRecovered;
}

export function clearCorruptedWcicFlag(): void {
  corruptedWcicRecovered = false;
}

function readRawWcicEntry(key: string): {
  present: boolean;
  parseError: boolean;
  value: unknown;
} {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return { present: false, parseError: false, value: null };
    }
    if (raw.trim() === '') {
      return { present: true, parseError: true, value: null };
    }
    return { present: true, parseError: false, value: JSON.parse(raw) };
  } catch (err) {
    console.warn(`Failed parsing localStorage key "${key}":`, err);
    return { present: true, parseError: true, value: null };
  }
}

export function loadAiRecipes(householdId?: string): Recipe[] {
  const key = scopedKey('ai_recipes', householdId);
  const { present, parseError, value } = readRawWcicEntry(key);
  if (!present) return [];
  if (parseError || !Array.isArray(value)) {
    corruptedWcicRecovered = true;
    safeRemove(key);
    return [];
  }

  const valid: Recipe[] = [];
  for (const item of value) {
    const check = validateAiRecipe(item, INGREDIENTS, {});
    if (check.valid) {
      valid.push(check.recipe);
    }
  }
  const capped = valid.slice(-MAX_AI_RECIPES);
  if (valid.length < value.length) {
    corruptedWcicRecovered = true;
    safeSet(key, capped);
  }
  return capped;
}

export function saveAiRecipes(recipes: Recipe[], householdId?: string): boolean {
  const capped = Array.isArray(recipes) ? recipes.slice(-MAX_AI_RECIPES) : [];
  return safeSet(scopedKey('ai_recipes', householdId), capped);
}

export function clearAiRecipesStorage(householdId?: string): void {
  safeRemove(scopedKey('ai_recipes', householdId));
  safeRemove(LEGACY_KEYS.AI_RECIPES);
  safeRemove(LEGACY_KEYS.LEGACY_AI_RECIPES);
}

export function loadPriceOverrides(householdId?: string): PriceMap {
  const key = scopedKey('prices', householdId);
  const { present, parseError, value } = readRawWcicEntry(key);
  if (!present) return {};
  if (parseError || !value || typeof value !== 'object' || Array.isArray(value)) {
    corruptedWcicRecovered = true;
    safeRemove(key);
    return {};
  }

  const clean: PriceMap = {};
  let hadBadEntry = false;
  for (const [id, entry] of Object.entries(value)) {
    if (!id || !entry || typeof entry !== 'object' || Array.isArray(entry)) {
      hadBadEntry = true;
      continue;
    }
    const p = entry as { perUnitPaise?: unknown; unit?: unknown };
    if (
      typeof p.perUnitPaise === 'number' &&
      Number.isInteger(p.perUnitPaise) &&
      p.perUnitPaise > 0 &&
      typeof p.unit === 'string' &&
      p.unit.trim().length > 0
    ) {
      clean[id] = {
        perUnitPaise: p.perUnitPaise,
        unit: p.unit.trim(),
      };
    } else {
      hadBadEntry = true;
    }
  }
  if (hadBadEntry) {
    corruptedWcicRecovered = true;
    if (Object.keys(clean).length === 0) {
      safeRemove(key);
    } else {
      safeSet(key, clean);
    }
  }
  return clean;
}

export function savePriceOverrides(overrides: PriceMap, householdId?: string): boolean {
  const safeMap: PriceMap = {};
  if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
    for (const [id, entry] of Object.entries(overrides)) {
      if (
        id &&
        entry &&
        typeof entry.perUnitPaise === 'number' &&
        Number.isInteger(entry.perUnitPaise) &&
        entry.perUnitPaise > 0 &&
        typeof entry.unit === 'string' &&
        entry.unit.trim().length > 0
      ) {
        safeMap[id] = {
          perUnitPaise: entry.perUnitPaise,
          unit: entry.unit.trim(),
        };
      }
    }
  }
  return safeSet(scopedKey('prices', householdId), safeMap);
}

export function clearPriceOverridesStorage(householdId?: string): void {
  safeRemove(scopedKey('prices', householdId));
}

function isValidTimeHHMM(val: unknown): val is string {
  if (typeof val !== 'string' || !/^\d{2}:\d{2}$/.test(val)) return false;
  const [hh, mm] = val.split(':').map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export function sanitizeReminders(raw: unknown): ReminderSettings {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const pickMeal = (key: 'breakfast' | 'lunch' | 'dinner') => {
    const slot = r[key] && typeof r[key] === 'object' && !Array.isArray(r[key]) ? (r[key] as Record<string, unknown>) : {};
    return {
      enabled: typeof slot.enabled === 'boolean' ? slot.enabled : DEFAULT_REMINDERS[key].enabled,
      time: isValidTimeHHMM(slot.time) ? slot.time : DEFAULT_REMINDERS[key].time,
    };
  };
  const water = r.water && typeof r.water === 'object' && !Array.isArray(r.water) ? (r.water as Record<string, unknown>) : {};
  return {
    breakfast: pickMeal('breakfast'),
    lunch: pickMeal('lunch'),
    dinner: pickMeal('dinner'),
    water: { enabled: typeof water.enabled === 'boolean' ? water.enabled : false },
  };
}

export function sanitizeFestivalSelection(raw: unknown): FestivalSelection | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const f = raw as { id?: unknown; selectedAt?: unknown };
  if (
    typeof f.id === 'string' &&
    VALID_FESTIVAL_IDS.has(f.id) &&
    typeof f.selectedAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(f.selectedAt)
  ) {
    return { id: f.id as FestivalSelection['id'], selectedAt: f.selectedAt };
  }
  return null;
}

export function sanitizeWeeklyNutritionGoal(raw: unknown): WeeklyNutritionGoal | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const g = raw as Record<string, unknown>;
  const minCal = Number(g.minCalories);
  const maxCal = Number(g.maxCalories);
  if (
    !Number.isFinite(minCal) ||
    !Number.isFinite(maxCal) ||
    minCal <= 0 ||
    maxCal < minCal ||
    maxCal > 200000
  ) {
    return null;
  }
  const proteinRaw = g.proteinGrams;
  const proteinGrams =
    typeof proteinRaw === 'number' && Number.isFinite(proteinRaw) && proteinRaw > 0 && proteinRaw <= 5000
      ? Math.round(proteinRaw)
      : null;
  const scope = g.scope === 'household' ? 'household' : 'perServing';
  return {
    minCalories: Math.round(minCal),
    maxCalories: Math.round(maxCal),
    proteinGrams,
    scope,
  };
}

export function normalizeWcicSettings(raw: unknown): WcicSettings {
  const defaults = createDefaultWcicSettings();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
  const s = raw as Record<string, unknown>;
  const hiddenRecipeIds = Array.isArray(s.hiddenRecipeIds)
    ? Array.from(
        new Set(
          s.hiddenRecipeIds.filter(
            (id): id is string => typeof id === 'string' && id.trim().length > 0
          )
        )
      )
    : [];
  return {
    showCost: typeof s.showCost === 'boolean' ? s.showCost : true,
    showVisuals: typeof s.showVisuals === 'boolean' ? s.showVisuals : true,
    showIngredientImages:
      typeof s.showIngredientImages === 'boolean' ? s.showIngredientImages : true,
    hiddenRecipeIds,
    reminders: sanitizeReminders(s.reminders),
    storeOrder: normalizeStoreOrder(s.storeOrder as string[]) as IngredientCategory[],
    festival: sanitizeFestivalSelection(s.festival),
    weeklyNutritionGoal: sanitizeWeeklyNutritionGoal(s.weeklyNutritionGoal),
  };
}

/**
 * Load display & app settings ("wcic_hh_<id>_settings") with safe defaults and normalization.
 */
export function loadWcicSettings(householdId?: string): WcicSettings {
  const key = scopedKey('settings', householdId);
  const { present, parseError, value } = readRawWcicEntry(key);
  if (!present) {
    return createDefaultWcicSettings();
  }
  if (parseError || !value || typeof value !== 'object' || Array.isArray(value)) {
    corruptedWcicRecovered = true;
    const defaults = createDefaultWcicSettings();
    safeSet(key, defaults);
    return defaults;
  }
  return normalizeWcicSettings(value);
}

/**
 * Persist display & app settings for the active household.
 */
export function saveWcicSettings(settings: WcicSettings, householdId?: string): boolean {
  return safeSet(scopedKey('settings', householdId), normalizeWcicSettings(settings));
}

/**
 * Load active/archived leftovers ("wcic_hh_<id>_leftovers").
 */
export function loadLeftovers(householdId?: string): LeftoverItem[] {
  const key = scopedKey('leftovers', householdId);
  const { present, parseError, value } = readRawWcicEntry(key);
  if (!present) return [];
  if (parseError || !Array.isArray(value)) {
    corruptedWcicRecovered = true;
    safeSet(key, []);
    return [];
  }
  return value.filter((item): item is LeftoverItem => {
    if (!item || typeof item !== 'object') return false;
    const lo = item as Partial<LeftoverItem>;
    return (
      typeof lo.id === 'string' &&
      lo.id.trim().length > 0 &&
      typeof lo.recipeId === 'string' &&
      lo.recipeId.trim().length > 0 &&
      typeof lo.portions === 'number' &&
      Number.isFinite(lo.portions) &&
      lo.portions >= 0 &&
      typeof lo.cookedDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(lo.cookedDate) &&
      typeof lo.keepUntil === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(lo.keepUntil) &&
      typeof lo.usedUp === 'boolean'
    );
  });
}

export function saveLeftovers(items: LeftoverItem[], householdId?: string): boolean {
  const clean = Array.isArray(items) ? items : [];
  return safeSet(scopedKey('leftovers', householdId), clean);
}

/**
 * Load perishable ingredient bought-on dates ("wcic_hh_<id>_pantry").
 */
export function loadPantryEntries(householdId?: string): PantryEntry[] {
  const key = scopedKey('pantry', householdId);
  const { present, parseError, value } = readRawWcicEntry(key);
  if (!present) return [];
  if (parseError || !Array.isArray(value)) {
    corruptedWcicRecovered = true;
    safeSet(key, []);
    return [];
  }
  return value.filter((item): item is PantryEntry => {
    if (!item || typeof item !== 'object') return false;
    const p = item as Partial<PantryEntry>;
    return (
      typeof p.ingredientId === 'string' &&
      p.ingredientId.trim().length > 0 &&
      typeof p.boughtOn === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(p.boughtOn)
    );
  });
}

export function savePantryEntries(entries: PantryEntry[], householdId?: string): boolean {
  const clean = Array.isArray(entries) ? entries : [];
  return safeSet(scopedKey('pantry', householdId), clean);
}

/**
 * Load grocery purchase estimates ("wcic_hh_<id>_purchases").
 */
export function loadPurchases(householdId?: string): PurchaseRecord[] {
  const key = scopedKey('purchases', householdId);
  const { present, parseError, value } = readRawWcicEntry(key);
  if (!present) return [];
  if (parseError || !Array.isArray(value)) {
    corruptedWcicRecovered = true;
    safeSet(key, []);
    return [];
  }
  return value.filter((item): item is PurchaseRecord => {
    if (!item || typeof item !== 'object') return false;
    const pr = item as Partial<PurchaseRecord>;
    return (
      typeof pr.id === 'string' &&
      pr.id.trim().length > 0 &&
      typeof pr.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(pr.date) &&
      typeof pr.totalPaise === 'number' &&
      Number.isFinite(pr.totalPaise) &&
      pr.totalPaise >= 0 &&
      typeof pr.itemCount === 'number' &&
      Number.isFinite(pr.itemCount) &&
      pr.itemCount >= 0
    );
  });
}

export function savePurchases(records: PurchaseRecord[], householdId?: string): boolean {
  const clean = Array.isArray(records) ? records : [];
  return safeSet(scopedKey('purchases', householdId), clean);
}

/**
 * Load the full persisted state bundle for any household id (used by multi-household "Export all").
 */
export function loadHouseholdBundle(householdId: string) {
  return {
    household: loadHousehold(householdId) || { adults: 2, children: [] },
    defaultDiet: loadDefaultDiet(householdId),
    allergies: loadAllergies(householdId),
    favoriteRecipeIds: loadFavoriteRecipeIds(householdId),
    cookedMeals: loadCookedMeals(householdId),
    groceryList: loadGroceryList(householdId),
    plannedMeals: loadPlannedMeals(householdId),
    wcic_ai_recipes: loadAiRecipes(householdId),
    wcic_prices: loadPriceOverrides(householdId),
    wcic_settings: loadWcicSettings(householdId),
    wcic_leftovers: loadLeftovers(householdId),
    wcic_pantry: loadPantryEntries(householdId),
    wcic_purchases: loadPurchases(householdId),
  };
}

/**
 * Write a validated bundle cleanly into the given household id.
 */
export function saveHouseholdBundle(
  householdId: string,
  data: ReturnType<typeof loadHouseholdBundle>
): void {
  saveHousehold(data.household, householdId);
  saveDefaultDiet(data.defaultDiet, householdId);
  saveAllergies(data.allergies, householdId);
  saveFavoriteRecipeIds(data.favoriteRecipeIds, householdId);
  saveCookedMeals(data.cookedMeals, householdId);
  saveGroceryList(data.groceryList, householdId);
  savePlannedMeals(data.plannedMeals, householdId);
  saveAiRecipes(data.wcic_ai_recipes, householdId);
  savePriceOverrides(data.wcic_prices, householdId);
  saveWcicSettings(data.wcic_settings, householdId);
  saveLeftovers(data.wcic_leftovers, householdId);
  savePantryEntries(data.wcic_pantry, householdId);
  savePurchases(data.wcic_purchases, householdId);
}

/**
 * Remove all application keys for active household (or all households if clearing everything).
 */
export function clearAllAppData(householdId?: string): void {
  corruptedWcicRecovered = false;
  if (householdId) {
    for (const spec of HOUSEHOLD_SCOPED_SPECS) {
      safeRemove(scopedKey(spec.suffix, householdId));
    }
    return;
  }
  const reg = readRegistry();
  for (const h of reg.households) {
    for (const spec of HOUSEHOLD_SCOPED_SPECS) {
      safeRemove(householdStorageKey(h.id, spec.suffix));
    }
  }
  Object.values(LEGACY_KEYS).forEach((k) => safeRemove(k));
}
