// Pure meal planning utilities: weekly grid helpers, 3-per-slot cap, copy last week, auto-plan week, and grocery integration.
import { getIngredientById, RECIPES } from '../recipes.js';
import { addDays, formatDate, getWeekDays, parseLocalDate } from './calendarHelpers.js';
import { addRecipeItems } from './groceryUtils.js';

export const MAX_RECIPES_PER_SLOT = 3;
export const PLAN_MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];

function makePlanId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Return the 7 week day descriptors (Monday through Sunday) for a target anchor date.
 * @param {Date|string} anchorDate
 * @returns {Array<{ date: Date, iso: string, dayNumber: number, shortDay: string, fullLabel: string }>}
 */
export function getPlanWeekDays(anchorDate) {
  const d =
    anchorDate instanceof Date ? anchorDate : parseLocalDate(String(anchorDate || ''));
  return getWeekDays(d);
}

/**
 * Return planned meals belonging to a specific (date, mealType) slot.
 * @param {Array<object>} plannedMeals
 * @param {string} dateIso
 * @param {string} mealType
 * @returns {Array<object>}
 */
export function getSlotMeals(plannedMeals, dateIso, mealType) {
  return (plannedMeals || []).filter(
    (m) => m.date === dateIso && m.mealType === mealType
  );
}

/**
 * Return true if the (date, mealType) slot has fewer than MAX_RECIPES_PER_SLOT items.
 * @param {Array<object>} plannedMeals
 * @param {string} dateIso
 * @param {string} mealType
 * @returns {boolean}
 */
export function canAddToSlot(plannedMeals, dateIso, mealType) {
  return getSlotMeals(plannedMeals, dateIso, mealType).length < MAX_RECIPES_PER_SLOT;
}

/**
 * Add a recipe to a (date, mealType) slot while enforcing the 3-recipe slot cap.
 * @param {Array<object>} plannedMeals
 * @param {{ date: string, mealType: string, recipeId: string, servings: number, note?: string }} input
 * @returns {{ nextList: Array<object>, error: string|null, added: object|null }}
 */
export function addPlannedMeal(plannedMeals, input) {
  const safeList = Array.isArray(plannedMeals) ? plannedMeals : [];
  const { date, mealType, recipeId, servings, note } = input || {};

  if (!date || !mealType || !recipeId) {
    return { nextList: safeList, error: 'Missing required meal slot details.', added: null };
  }

  if (!canAddToSlot(safeList, date, mealType)) {
    return {
      nextList: safeList,
      error: `This slot is full (max ${MAX_RECIPES_PER_SLOT} recipes).`,
      added: null,
    };
  }

  const newEntry = {
    id: makePlanId(),
    date,
    mealType,
    recipeId,
    status: 'planned',
    servings: Math.max(0.5, Number(servings) || 1),
    note: note ? String(note).trim().slice(0, 200) : undefined,
  };

  return {
    nextList: [...safeList, newEntry],
    error: null,
    added: newEntry,
  };
}

/**
 * Update the status ('planned' | 'cooked' | 'skipped') of a planned meal entry.
 * @param {Array<object>} plannedMeals
 * @param {string} planId
 * @param {'planned'|'cooked'|'skipped'} status
 * @returns {Array<object>}
 */
export function updatePlannedMealStatus(plannedMeals, planId, status) {
  return (plannedMeals || []).map((m) =>
    m.id === planId ? { ...m, status } : m
  );
}

/**
 * Remove a planned meal entry by id.
 * @param {Array<object>} plannedMeals
 * @param {string} planId
 * @returns {Array<object>}
 */
export function removePlannedMeal(plannedMeals, planId) {
  return (plannedMeals || []).filter((m) => m.id !== planId);
}

/**
 * Copy all planned meals from the previous 7 days into the target week (+7 days),
 * resetting status to 'planned' and skipping slots that are already full.
 * @param {Array<object>} plannedMeals
 * @param {string} targetMondayIso
 * @returns {{ nextList: Array<object>, copiedCount: number, skippedCount: number, sourceCount: number }}
 */
export function copyLastWeek(plannedMeals, targetMondayIso) {
  const safeList = Array.isArray(plannedMeals) ? plannedMeals : [];
  const targetMonday = parseLocalDate(targetMondayIso);
  const prevDates = new Set();
  for (let i = -7; i <= -1; i += 1) {
    prevDates.add(formatDate(addDays(targetMonday, i)));
  }

  const sourceMeals = safeList.filter((m) => prevDates.has(m.date));
  let workingList = [...safeList];
  let copiedCount = 0;
  let skippedCount = 0;

  for (const meal of sourceMeals) {
    const shiftedDate = formatDate(addDays(parseLocalDate(meal.date), 7));
    if (!canAddToSlot(workingList, shiftedDate, meal.mealType)) {
      skippedCount += 1;
      continue;
    }

    const cloned = {
      id: makePlanId(),
      date: shiftedDate,
      mealType: meal.mealType,
      recipeId: meal.recipeId,
      status: 'planned',
      servings: meal.servings,
      note: meal.note,
    };
    workingList = [...workingList, cloned];
    copiedCount += 1;
  }

  return {
    nextList: workingList,
    copiedCount,
    skippedCount,
    sourceCount: sourceMeals.length,
  };
}

/**
 * Compute summary stats for a visible week's planned meals.
 * @param {Array<object>} plannedMeals
 * @param {Array<string>} weekDateIsos
 * @param {Map<string, object>} recipeMap
 * @returns {{ totalCount: number, pendingCount: number, cookedCount: number, skippedCount: number, vegCount: number, nonVegCount: number }}
 */
export function computeWeekSummary(plannedMeals, weekDateIsos, recipeMap) {
  const dateSet = new Set(weekDateIsos || []);
  const weekMeals = (plannedMeals || []).filter((m) => dateSet.has(m.date));

  let pendingCount = 0;
  let cookedCount = 0;
  let skippedCount = 0;
  let vegCount = 0;
  let nonVegCount = 0;

  for (const m of weekMeals) {
    if (m.status === 'cooked') cookedCount += 1;
    else if (m.status === 'skipped') skippedCount += 1;
    else pendingCount += 1;

    const rec =
      recipeMap instanceof Map ? recipeMap.get(m.recipeId) : recipeMap?.[m.recipeId];
    if (rec?.diet === 'nonveg') nonVegCount += 1;
    else vegCount += 1;
  }

  return {
    totalCount: weekMeals.length,
    pendingCount,
    cookedCount,
    skippedCount,
    vegCount,
    nonVegCount,
  };
}

/**
 * Aggregate estimated nutritional content (calories, protein, carbs, fat, fiber)
 * for all active (non-skipped) planned meals in the visible week.
 * Computes both household-scaled totals (using meal.servings) and per-adult-serving sums.
 * @param {Array<object>} plannedMeals
 * @param {Array<string>} weekDateIsos
 * @param {Map<string, object>|Record<string, object>} recipeMap
 */
export function computeWeekNutritionSummary(plannedMeals, weekDateIsos, recipeMap) {
  const dateSet = new Set(weekDateIsos || []);
  const activeMeals = (plannedMeals || []).filter(
    (m) => m && dateSet.has(m.date) && m.status !== 'skipped'
  );

  const household = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const perServing = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const keys = ['calories', 'protein', 'carbs', 'fat', 'fiber'];

  let countedNutritionMeals = 0;
  let missingNutritionMeals = 0;

  const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v) && !Number.isNaN(v);

  for (const meal of activeMeals) {
    const rec =
      recipeMap instanceof Map ? recipeMap.get(meal.recipeId) : recipeMap?.[meal.recipeId];
    const nut = rec?.nutritionPerServing;

    if (!nut || (!isFiniteNum(nut.calories) && !isFiniteNum(nut.protein) && !isFiniteNum(nut.carbs))) {
      missingNutritionMeals += 1;
      continue;
    }

    countedNutritionMeals += 1;
    const servings = Math.max(0.5, Number(meal.servings) || Number(rec?.baseServings) || 1);

    for (const key of keys) {
      const val = nut[key];
      if (isFiniteNum(val) && val >= 0) {
        perServing[key] += val;
        household[key] += val * servings;
      }
    }
  }

  const roundOne = (n) => Math.round(n * 10) / 10;
  for (const key of keys) {
    household[key] = key === 'calories' ? Math.round(household[key]) : roundOne(household[key]);
    perServing[key] = key === 'calories' ? Math.round(perServing[key]) : roundOne(perServing[key]);
  }

  return {
    activeMealCount: activeMeals.length,
    countedNutritionMeals,
    missingNutritionMeals,
    household,
    perServing,
  };
}

/**
 * Add missing ingredients for all pending ('planned') meals in the active week to the grocery list.
 * @param {Array<object>} groceryList
 * @param {Array<object>} plannedMeals
 * @param {Array<string>} weekDateIsos
 * @param {Map<string, object>} recipeMap
 * @param {object} household
 * @param {Array<string>} [ownedIngredientIds]
 * @returns {{ nextGroceryList: Array<object>, addedCount: number }}
 */
export function addWeekMissingToGrocery(
  groceryList,
  plannedMeals,
  weekDateIsos,
  recipeMap,
  household,
  ownedIngredientIds = []
) {
  const dateSet = new Set(weekDateIsos || []);
  const pendingWeekMeals = (plannedMeals || []).filter(
    (m) => dateSet.has(m.date) && m.status === 'planned'
  );

  let nextList = Array.isArray(groceryList) ? [...groceryList] : [];
  const prevById = new Map(nextList.map((g) => [g.id, g]));
  const newlyTrackedRecipePairs = new Set();

  for (const meal of pendingWeekMeals) {
    const recipe =
      recipeMap instanceof Map ? recipeMap.get(meal.recipeId) : recipeMap?.[meal.recipeId];
    if (!recipe) continue;
    nextList = addRecipeItems(nextList, recipe, household, false, ownedIngredientIds);
  }

  let addedCount = 0;
  for (const item of nextList) {
    const prev = prevById.get(item.id);
    const prevRecipes = new Set(prev?.fromRecipeIds || []);
    const hasNewRecipeContribution = (item.fromRecipeIds || []).some(
      (rid) => !prevRecipes.has(rid)
    );
    if (!prev || hasNewRecipeContribution) {
      if (!newlyTrackedRecipePairs.has(item.id)) {
        newlyTrackedRecipePairs.add(item.id);
        addedCount += 1;
      }
    }
  }

  return { nextGroceryList: nextList, addedCount };
}

/**
 * Determine whether a past planned meal should display the "Did you cook this?" reminder.
 * @param {object} meal
 * @param {string} todayIso
 * @returns {boolean}
 */
export function isPastPlannedReminder(meal, todayIso) {
  return Boolean(meal && meal.status === 'planned' && meal.date < todayIso);
}

/**
 * Build a structured weekly schedule tailored for printer-friendly kitchen wall posters.
 * Returns normalized 7-day x 4-meal-type slots with safe '-' fallbacks and counts.
 */
export function buildPrintableWeekSchedule({
  plannedMeals = [],
  weekDays = [],
  recipeMap = new Map(),
  includeSkipped = false,
} = {}) {
  const safeMeals = Array.isArray(plannedMeals) ? plannedMeals : [];
  const safeDays = Array.isArray(weekDays) ? weekDays : [];
  const getRecipe = (recipeId) =>
    recipeMap instanceof Map ? recipeMap.get(recipeId) : recipeMap?.[recipeId];

  const cleanText = (val) => {
    if (val === undefined || val === null) return '-';
    if (typeof val === 'number' && Number.isNaN(val)) return '-';
    const s = String(val).trim();
    return s.length > 0 ? s : '-';
  };

  let totalMealCount = 0;
  let cookedCount = 0;

  const days = safeDays.map((day) => {
    const slots = {};
    for (const mealType of PLAN_MEAL_TYPES) {
      const slotItems = getSlotMeals(safeMeals, day.iso, mealType).filter((m) =>
        includeSkipped ? true : m.status !== 'skipped'
      );

      slots[mealType] = slotItems.map((m) => {
        const rec = getRecipe(m.recipeId);
        const prep = Number(rec?.prepMinutes);
        const cook = Number(rec?.cookMinutes);
        const totalMinutes =
          Number.isFinite(prep) && Number.isFinite(cook) && prep + cook > 0
            ? prep + cook
            : null;
        const servingsNum = Number(m.servings);
        const servingsText =
          Number.isFinite(servingsNum) && servingsNum > 0
            ? Number.isInteger(servingsNum)
              ? `${servingsNum}`
              : servingsNum.toFixed(2).replace(/0$/, '')
            : '-';

        totalMealCount += 1;
        if (m.status === 'cooked') cookedCount += 1;

        return {
          id: m.id,
          recipeId: m.recipeId,
          name: rec ? cleanText(rec.name) : 'Recipe unavailable',
          diet: rec?.diet === 'nonveg' ? 'nonveg' : 'veg',
          totalMinutes,
          servingsText,
          status: m.status === 'cooked' || m.status === 'skipped' ? m.status : 'planned',
          isCooked: m.status === 'cooked',
          isSkipped: m.status === 'skipped',
          note: m.note ? cleanText(m.note) : '',
        };
      });
    }

    return {
      iso: day.iso,
      shortDay: day.shortDay,
      dayNumber: day.dayNumber,
      fullLabel: day.fullLabel,
      slots,
    };
  });

  return {
    days,
    totalMealCount,
    cookedCount,
  };
}

/**
 * Evaluate how close a planned week's estimated calories (and optional protein)
 * are to the user's Weekly Nutrition Goal range.
 */
export function evaluateWeeklyNutritionGoal(actualCalories, goal, actualProtein = null) {
  if (!goal || typeof goal !== 'object') return null;
  const minCal = Number(goal.minCalories);
  const maxCal = Number(goal.maxCalories);
  if (!Number.isFinite(minCal) || !Number.isFinite(maxCal) || minCal <= 0 || maxCal < minCal) {
    return null;
  }

  const safeCalories =
    typeof actualCalories === 'number' && Number.isFinite(actualCalories) && actualCalories > 0
      ? Math.round(actualCalories)
      : 0;

  let status = 'empty';
  if (safeCalories > 0) {
    if (safeCalories < minCal) status = 'below';
    else if (safeCalories <= maxCal) status = 'in_range';
    else status = 'above';
  }

  const denominator = maxCal > 0 ? maxCal : minCal;
  const calorieBarPct = Math.min(100, Math.max(0, Math.round((safeCalories / denominator) * 100)));
  const targetMinPct = Math.min(100, Math.max(0, Math.round((minCal / denominator) * 100)));

  const proteinGoalRaw = Number(goal.proteinGrams);
  const proteinGoalGrams =
    Number.isFinite(proteinGoalRaw) && proteinGoalRaw > 0 ? Math.round(proteinGoalRaw) : null;
  const safeProtein =
    typeof actualProtein === 'number' && Number.isFinite(actualProtein) && actualProtein >= 0
      ? Math.round(actualProtein * 10) / 10
      : null;

  const proteinRawPct =
    proteinGoalGrams !== null && safeProtein !== null
      ? Math.round((safeProtein / proteinGoalGrams) * 100)
      : null;
  const proteinBarPct =
    proteinRawPct !== null ? Math.min(100, Math.max(0, proteinRawPct)) : null;

  return {
    status,
    actualCalories: safeCalories,
    minCalories: Math.round(minCal),
    maxCalories: Math.round(maxCal),
    calorieBarPct,
    targetMinPct,
    remainingToMin: Math.max(0, Math.round(minCal) - safeCalories),
    overMax: Math.max(0, safeCalories - Math.round(maxCal)),
    proteinGoalGrams,
    actualProtein: safeProtein,
    proteinBarPct,
    proteinRawPct,
  };
}

/**
 * Auto-fill a visible week with balanced, allergy-safe recipes without overwriting existing slots.
 * Prefers saved ingredients, avoids repeating the same recipe within 3 days, alternates veg/non-veg
 * when allowed, and ensures at least one >=12g protein dish per day.
 */
export function generateAutoPlanWeek({
  weekDateIsos = [],
  existingPlannedMeals = [],
  recipes = RECIPES,
  diet = 'veg',
  allergies = [],
  ownedIngredientIds = [],
  emptySlotsOnly = true,
  dietMix = 'balanced',
  servings = 2,
  mealTypes = PLAN_MEAL_TYPES,
} = {}) {
  const safeExisting = Array.isArray(existingPlannedMeals) ? existingPlannedMeals : [];
  const allergySet = new Set(Array.isArray(allergies) ? allergies : []);
  const ownedMainSet = new Set(
    (Array.isArray(ownedIngredientIds) ? ownedIngredientIds : []).filter(
      (id) => id && !getIngredientById(id)?.assumedAvailable
    )
  );
  const safeRecipes = (Array.isArray(recipes) ? recipes : []).filter((r) => {
    if (!r || !r.id) return false;
    if (diet === 'veg' && r.diet === 'nonveg') return false;
    if (Array.isArray(r.allergens) && r.allergens.some((a) => allergySet.has(a))) {
      return false;
    }
    return true;
  });

  const recipeById = new Map(safeRecipes.map((r) => [r.id, r]));
  const fullRecipeMap = new Map(
    (Array.isArray(recipes) ? recipes : []).map((r) => [r.id, r])
  );

  const scorePantryOverlap = (recipe) => {
    if (ownedMainSet.size === 0 || !Array.isArray(recipe?.ingredients)) return 0;
    let hits = 0;
    for (const item of recipe.ingredients) {
      if (ownedMainSet.has(item?.ingredientId)) hits += 1;
    }
    return hits;
  };

  let workingList = [...safeExisting];
  const proposals = [];
  const lastUsedDayByRecipe = new Map();
  let lastPickedDiet = null;

  // Seed lastUsedDayByRecipe from existing meals in or before this week
  for (let dIdx = 0; dIdx < weekDateIsos.length; dIdx += 1) {
    const dIso = weekDateIsos[dIdx];
    for (const m of safeExisting) {
      if (m.date === dIso && m.recipeId) {
        lastUsedDayByRecipe.set(m.recipeId, dIdx);
      }
    }
  }

  for (let dIdx = 0; dIdx < weekDateIsos.length; dIdx += 1) {
    const dateIso = weekDateIsos[dIdx];
    let dayHasHighProtein = safeExisting.some((m) => {
      if (m.date !== dateIso || m.status === 'skipped') return false;
      const rec = fullRecipeMap.get(m.recipeId);
      return (Number(rec?.nutritionPerServing?.protein) || 0) >= 12;
    });

    const targetSlots = [];
    for (const mt of mealTypes) {
      const existingInSlot = getSlotMeals(workingList, dateIso, mt);
      if (emptySlotsOnly && existingInSlot.length > 0) continue;
      if (!canAddToSlot(workingList, dateIso, mt)) continue;
      targetSlots.push(mt);
    }

    for (let sIdx = 0; sIdx < targetSlots.length; sIdx += 1) {
      const mealType = targetSlots[sIdx];
      const mealCandidates = safeRecipes.filter(
        (r) => Array.isArray(r.mealTypes) && r.mealTypes.includes(mealType)
      );
      if (mealCandidates.length === 0) continue;

      const isLastOpenSlotToday = sIdx === targetSlots.length - 1;
      const needHighProteinNow = !dayHasHighProtein && (mealType === 'dinner' || mealType === 'lunch' || isLastOpenSlotToday);

      const nonRepeated = mealCandidates.filter((r) => {
        const prevIdx = lastUsedDayByRecipe.get(r.id);
        return prevIdx === undefined || Math.abs(dIdx - prevIdx) >= 3;
      });
      const poolStep1 = nonRepeated.length > 0 ? nonRepeated : mealCandidates;

      let pool = poolStep1;
      if (needHighProteinNow) {
        const hp = poolStep1.filter((r) => (Number(r.nutritionPerServing?.protein) || 0) >= 12);
        if (hp.length > 0) pool = hp;
      }

      if (diet === 'nonveg' && dietMix === 'balanced' && lastPickedDiet) {
        const oppositeDiet = lastPickedDiet === 'veg' ? 'nonveg' : 'veg';
        const alt = pool.filter((r) => r.diet === oppositeDiet);
        if (alt.length > 0) pool = alt;
      }

      if (diet === 'nonveg' && dietMix === 'veg_only') {
        const vegOnly = pool.filter((r) => r.diet === 'veg');
        if (vegOnly.length > 0) pool = vegOnly;
      }

      // Rank by pantry overlap desc, protein bonus if needed, fewer uses this week asc, quickness asc
      const scored = [...pool].sort((a, b) => {
        const ovA = scorePantryOverlap(a);
        const ovB = scorePantryOverlap(b);
        if (ovB !== ovA) return ovB - ovA;
        if (!dayHasHighProtein) {
          const pA = Number(a.nutritionPerServing?.protein) || 0;
          const pB = Number(b.nutritionPerServing?.protein) || 0;
          if ((pB >= 12) !== (pA >= 12)) return pB >= 12 ? 1 : -1;
        }
        const usedA = lastUsedDayByRecipe.has(a.id) ? 1 : 0;
        const usedB = lastUsedDayByRecipe.has(b.id) ? 1 : 0;
        if (usedA !== usedB) return usedA - usedB;
        const tA = (Number(a.prepMinutes) || 0) + (Number(a.cookMinutes) || 0);
        const tB = (Number(b.prepMinutes) || 0) + (Number(b.cookMinutes) || 0);
        if (tA !== tB) return tA - tB;
        return String(a.id).localeCompare(String(b.id));
      });

      const chosen = scored[0] || recipeById.get(pool[0]?.id);
      if (!chosen) continue;

      const addedRes = addPlannedMeal(workingList, {
        date: dateIso,
        mealType,
        recipeId: chosen.id,
        servings: Math.max(1, Number(servings) || 2),
      });
      if (!addedRes.added) continue;

      workingList = addedRes.nextList;
      lastUsedDayByRecipe.set(chosen.id, dIdx);
      lastPickedDiet = chosen.diet;
      if ((Number(chosen.nutritionPerServing?.protein) || 0) >= 12) {
        dayHasHighProtein = true;
      }

      proposals.push({
        ...addedRes.added,
        recipeName: chosen.name,
        diet: chosen.diet,
        protein: Number(chosen.nutritionPerServing?.protein) || 0,
      });
    }
  }

  return {
    proposals,
    nextList: workingList,
    addedCount: proposals.length,
  };
}

// Self-tests
(function runSelfTests() {
  let list = [];
  for (let i = 0; i < 3; i += 1) {
    const res = addPlannedMeal(list, {
      date: '2026-11-23',
      mealType: 'dinner',
      recipeId: `recipe_${i}`,
      servings: 2.75,
    });
    console.assert(res.error === null, 'First 3 meals in a slot should succeed');
    list = res.nextList;
  }

  const fourth = addPlannedMeal(list, {
    date: '2026-11-23',
    mealType: 'dinner',
    recipeId: 'recipe_3',
    servings: 2.75,
  });
  console.assert(
    fourth.error !== null && fourth.nextList.length === 3,
    '4th meal in same slot must be blocked as slot is full'
  );

  // Copy last week (+7 days) skipping full target slots
  const withPrevAndFullTarget = [
    { id: 'p1', date: '2026-11-16', mealType: 'lunch', recipeId: 'dal_tadka', status: 'cooked', servings: 2 },
    { id: 'p2', date: '2026-11-16', mealType: 'dinner', recipeId: 'chole', status: 'planned', servings: 2 },
    // Full target dinner slot on 2026-11-23 (3 items)
    ...list,
  ];
  const copied = copyLastWeek(withPrevAndFullTarget, '2026-11-23');
  console.assert(
    copied.copiedCount === 1 && copied.skippedCount === 1,
    `Expected 1 copied and 1 skipped, got copied=${copied.copiedCount}, skipped=${copied.skippedCount}`
  );
  console.assert(
    copied.nextList.some(
      (m) => m.date === '2026-11-23' && m.mealType === 'lunch' && m.status === 'planned'
    ),
    'Copied meal should shift by +7 days and reset status to planned'
  );

  // Summary counts match slots
  const summary = computeWeekSummary(copied.nextList, ['2026-11-23'], new Map());
  console.assert(
    summary.totalCount === 4 && summary.pendingCount === 4,
    'Week summary counts should match slots'
  );

  // Past planned reminder
  console.assert(
    isPastPlannedReminder({ date: '2026-11-16', status: 'planned' }, '2026-11-17') === true &&
      isPastPlannedReminder({ date: '2026-11-16', status: 'skipped' }, '2026-11-17') === false,
    'Past planned reminder check failed'
  );

  // Weekly nutrition aggregation excludes skipped meals and scales by servings
  const nutritionMap = new Map([
    [
      'r1',
      {
        id: 'r1',
        baseServings: 2,
        nutritionPerServing: { calories: 300, protein: 12, carbs: 40, fat: 8, fiber: 5 },
      },
    ],
    [
      'r2',
      {
        id: 'r2',
        baseServings: 2,
        nutritionPerServing: { calories: 450, protein: 20, carbs: 50, fat: 14, fiber: 6 },
      },
    ],
  ]);
  const nutSummary = computeWeekNutritionSummary(
    [
      { id: 'm1', date: '2026-11-23', mealType: 'lunch', recipeId: 'r1', status: 'planned', servings: 2 },
      { id: 'm2', date: '2026-11-24', mealType: 'dinner', recipeId: 'r2', status: 'cooked', servings: 3 },
      { id: 'm3', date: '2026-11-25', mealType: 'dinner', recipeId: 'r2', status: 'skipped', servings: 2 },
    ],
    ['2026-11-23', '2026-11-24', '2026-11-25'],
    nutritionMap
  );
  console.assert(
    nutSummary.activeMealCount === 2 &&
      nutSummary.countedNutritionMeals === 2 &&
      nutSummary.household.calories === 1950 &&
      nutSummary.household.protein === 84 &&
      nutSummary.household.carbs === 230 &&
      nutSummary.perServing.calories === 750,
    `Unexpected weekly nutrition summary: ${JSON.stringify(nutSummary)}`
  );

  // Auto-plan preserves existing slots, respects allergies, avoids 3-day repeats, and ensures >=12g protein/day
  const existingPre = [
    { id: 'keep-1', date: '2026-11-23', mealType: 'breakfast', recipeId: 'poha', status: 'planned', servings: 2 },
  ];
  const weekDates = ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'];
  const autoPlan = generateAutoPlanWeek({
    weekDateIsos: weekDates,
    existingPlannedMeals: existingPre,
    diet: 'nonveg',
    allergies: ['dairy'],
    ownedIngredientIds: ['egg', 'onion', 'chicken'],
    emptySlotsOnly: true,
    dietMix: 'balanced',
    servings: 2,
  });
  console.assert(
    autoPlan.nextList.some((m) => m.id === 'keep-1') &&
      autoPlan.proposals.every((p) => !(p.date === '2026-11-23' && p.mealType === 'breakfast')),
    'Auto-plan must never overwrite existing breakfast slot'
  );
  const autoDairyFree = autoPlan.proposals.every((p) => {
    const r = RECIPES.find((x) => x.id === p.recipeId);
    return !r?.allergens?.includes('dairy');
  });
  console.assert(autoDairyFree, 'Auto-plan must exclude dairy-allergic recipes');
  const everyDayHas12gProtein = weekDates.every((d) =>
    autoPlan.nextList
      .filter((m) => m.date === d)
      .some((m) => (RECIPES.find((x) => x.id === m.recipeId)?.nutritionPerServing?.protein ?? 0) >= 12)
  );
  console.assert(everyDayHas12gProtein, 'Auto-plan should include >=12g protein dish each day');

  // Printable kitchen-wall schedule builder excludes skipped meals by default and preserves safe fallbacks
  const printDays = getPlanWeekDays('2026-11-23');
  const printMap = new Map([
    [
      'dal_tadka',
      { id: 'dal_tadka', name: 'Dal Tadka', diet: 'veg', prepMinutes: 10, cookMinutes: 20 },
    ],
  ]);
  const printScheduleDefault = buildPrintableWeekSchedule({
    plannedMeals: [
      { id: 'pm1', date: '2026-11-23', mealType: 'lunch', recipeId: 'dal_tadka', status: 'cooked', servings: 2 },
      { id: 'pm2', date: '2026-11-23', mealType: 'dinner', recipeId: 'dal_tadka', status: 'skipped', servings: 2 },
    ],
    weekDays: printDays,
    recipeMap: printMap,
    includeSkipped: false,
  });
  console.assert(
    printScheduleDefault.days.length === 7 &&
      printScheduleDefault.totalMealCount === 1 &&
      printScheduleDefault.cookedCount === 1 &&
      printScheduleDefault.days[0].slots.lunch[0].totalMinutes === 30 &&
      printScheduleDefault.days[0].slots.dinner.length === 0,
    'Printable schedule should include 7 days and skip skipped meals by default'
  );
  const printScheduleWithSkipped = buildPrintableWeekSchedule({
    plannedMeals: [
      { id: 'pm1', date: '2026-11-23', mealType: 'lunch', recipeId: 'dal_tadka', status: 'cooked', servings: 2 },
      { id: 'pm2', date: '2026-11-23', mealType: 'dinner', recipeId: 'dal_tadka', status: 'skipped', servings: 2 },
    ],
    weekDays: printDays,
    recipeMap: printMap,
    includeSkipped: true,
  });
  console.assert(
    printScheduleWithSkipped.totalMealCount === 2 &&
      printScheduleWithSkipped.days[0].slots.dinner[0].isSkipped === true,
    'Printable schedule with includeSkipped=true should include skipped meal'
  );

  // Weekly nutrition goal evaluation tests (empty, below, in_range, above, protein)
  const sampleGoal = { minCalories: 12000, maxCalories: 15000, proteinGrams: 350 };
  const goalEmpty = evaluateWeeklyNutritionGoal(0, sampleGoal, 0);
  const goalBelow = evaluateWeeklyNutritionGoal(9000, sampleGoal, 210);
  const goalInRange = evaluateWeeklyNutritionGoal(13500, sampleGoal, 380);
  const goalAbove = evaluateWeeklyNutritionGoal(16500, sampleGoal, 400);
  console.assert(
    goalEmpty?.status === 'empty' &&
      goalBelow?.status === 'below' &&
      goalBelow?.remainingToMin === 3000 &&
      goalBelow?.calorieBarPct === 60 &&
      goalBelow?.proteinRawPct === 60 &&
      goalInRange?.status === 'in_range' &&
      goalInRange?.proteinBarPct === 100 &&
      goalInRange?.proteinRawPct === 109 &&
      goalAbove?.status === 'above' &&
      goalAbove?.overMax === 1500 &&
      evaluateWeeklyNutritionGoal(12000, null) === null,
    'Weekly nutrition goal evaluation failed'
  );
})();
