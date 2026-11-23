// Plain JS date & meal grouping helpers for the Kitchen Calendar. No external date libraries.

/**
 * Return a new Date set to local midnight (00:00:00.000) for the first day of the month.
 * @param {Date} date
 * @returns {Date}
 */
export function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Return a new Date set to Monday of the week containing `date` (local time).
 * @param {Date} date
 * @returns {Date}
 */
export function startOfWeekMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Return a new Date shifted by `days` calendar days in local time.
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a Date object as YYYY-MM-DD in the user's local timezone.
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a local midnight Date.
 * @param {string} isoDate
 * @returns {Date}
 */
export function parseLocalDate(isoDate) {
  const [y, m, d] = String(isoDate || '').split('-').map(Number);
  if (!y || !m || !d) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }
  const parsed = new Date(y, m - 1, d);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

/**
 * Build a 42-cell (6x7) month grid starting on Monday.
 * Accepts either `(year, monthIndex)` or a single `Date`.
 * @param {Date|number} dateOrYear
 * @param {number} [monthIndex]
 * @returns {Array<{ date: Date, iso: string, dayNumber: number, inCurrentMonth: boolean }>}
 */
export function getMonthGrid(dateOrYear, monthIndex) {
  const target =
    dateOrYear instanceof Date
      ? startOfMonth(dateOrYear)
      : new Date(Number(dateOrYear), Number(monthIndex ?? 0), 1);

  const targetMonth = target.getMonth();
  const gridStart = startOfWeekMonday(target);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const cellDate = addDays(gridStart, i);
    cells.push({
      date: cellDate,
      iso: formatDate(cellDate),
      dayNumber: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === targetMonth,
    });
  }
  return cells;
}

/**
 * Return the 7 Date/ISO entries (Monday to Sunday) for the week containing `date`.
 * @param {Date} date
 * @returns {Array<{ date: Date, iso: string, dayNumber: number, shortDay: string, fullLabel: string }>}
 */
export function getWeekDays(date) {
  const mon = startOfWeekMonday(date);
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(mon, i);
    days.push({
      date: d,
      iso: formatDate(d),
      dayNumber: d.getDate(),
      shortDay: d.toLocaleDateString(undefined, { weekday: 'short' }),
      fullLabel: d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    });
  }
  return days;
}

/**
 * Sort cookedMeals chronologically by date (YYYY-MM-DD) then time (HH:mm).
 * @param {Array<object>} meals
 * @returns {Array<object>}
 */
export function sortMealsByDateTime(meals) {
  return [...(meals || [])].sort((a, b) => {
    const dateCmp = String(a.date || '').localeCompare(String(b.date || ''));
    if (dateCmp !== 0) return dateCmp;
    return String(a.time || '').localeCompare(String(b.time || ''));
  });
}

/**
 * Group meals into a dictionary keyed by YYYY-MM-DD, with each day's list sorted by time.
 * @param {Array<object>} meals
 * @returns {Record<string, Array<object>>}
 */
export function groupMealsByDate(meals) {
  const grouped = {};
  for (const meal of sortMealsByDateTime(meals)) {
    const key = meal.date;
    if (!key) continue;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(meal);
  }
  return grouped;
}

/**
 * Format the visible calendar range heading (e.g. "November 2026", "16-22 Nov 2026", "Tuesday, 17 Nov 2026").
 * @param {"month"|"week"|"day"} mode
 * @param {Date} cursorDate
 * @param {string} selectedDateIso
 * @returns {string}
 */
export function formatRangeHeading(mode, cursorDate, selectedDateIso) {
  if (mode === 'month') {
    return cursorDate.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }
  if (mode === 'week') {
    const week = getWeekDays(parseLocalDate(selectedDateIso));
    const first = week[0].date;
    const last = week[6].date;
    const sameMonth =
      first.getMonth() === last.getMonth() &&
      first.getFullYear() === last.getFullYear();

    if (sameMonth) {
      const monthYear = last.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      });
      return `${first.getDate()}–${last.getDate()} ${monthYear}`;
    }

    const startStr = first.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    });
    const endStr = last.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${startStr} – ${endStr}`;
  }

  return parseLocalDate(selectedDateIso).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format full day panel title, e.g. "Tuesday, 17 November".
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDayPanelTitle(isoDate) {
  return parseLocalDate(isoDate).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Compute summary metrics for meals within the active calendar range.
 * @param {Array<object>} rangeMeals
 * @param {Map<string, object>|Record<string, object>} recipeMap
 * @returns {{ totalMeals: number, vegCount: number, nonVegCount: number, avgProteinPerDay: number|null, mostCookedLabel: string }}
 */
export function computePeriodSummary(rangeMeals, recipeMap) {
  const totalMeals = rangeMeals.length;
  const vegCount = rangeMeals.filter((m) => m.diet === 'veg').length;
  const nonVegCount = rangeMeals.filter((m) => m.diet === 'nonveg').length;

  if (totalMeals === 0) {
    return {
      totalMeals: 0,
      vegCount: 0,
      nonVegCount: 0,
      avgProteinPerDay: null,
      mostCookedLabel: '-',
    };
  }

  const proteinByDay = new Map();
  const recipeCounts = new Map();

  for (const meal of rangeMeals) {
    const recipe =
      recipeMap instanceof Map
        ? recipeMap.get(meal.recipeId)
        : recipeMap?.[meal.recipeId];

    const protein = Number(
      meal.proteinPerServing ?? recipe?.nutritionPerServing?.protein ?? 0
    );
    proteinByDay.set(meal.date, (proteinByDay.get(meal.date) ?? 0) + protein);

    const displayName = recipe?.name || meal.recipeName || 'Recipe unavailable';
    recipeCounts.set(displayName, (recipeCounts.get(displayName) ?? 0) + 1);
  }

  const daysWithMeals = proteinByDay.size;
  const totalProtein = Array.from(proteinByDay.values()).reduce(
    (sum, v) => sum + v,
    0
  );
  const avgProteinPerDay =
    daysWithMeals > 0
      ? Math.round((totalProtein / daysWithMeals) * 10) / 10
      : null;

  let maxCount = 0;
  for (const count of recipeCounts.values()) {
    if (count > maxCount) maxCount = count;
  }

  const topNames = Array.from(recipeCounts.entries())
    .filter(([, count]) => count === maxCount)
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));

  let mostCookedLabel = '-';
  if (topNames.length === 1) {
    mostCookedLabel = `${topNames[0]} (${maxCount})`;
  } else if (topNames.length > 1) {
    mostCookedLabel = `${topNames[0]} (${maxCount}) and ${topNames.length - 1} more`;
  }

  return {
    totalMeals,
    vegCount,
    nonVegCount,
    avgProteinPerDay,
    mostCookedLabel,
  };
}

/**
 * Build deduplicated, searchable quick-add presets from past cookedMeals.
 * Groups by recipeId (or normalized recipeName fallback), tracks cook frequency and most recent entry,
 * and filters by search query across recipe name, cuisine, tags, meal type, and notes.
 * @param {Array<object>} cookedMeals
 * @param {Map<string, object>|Record<string, object>} recipeMap
 * @param {string} [query='']
 * @returns {Array<{
 *   key: string,
 *   recipeId: string,
 *   recipeName: string,
 *   diet: 'veg'|'nonveg',
 *   mealType: 'breakfast'|'lunch'|'snacks'|'dinner',
 *   servings: number,
 *   proteinPerServing: number|null,
 *   lastCookedDate: string,
 *   lastCookedTime: string,
 *   timesCooked: number,
 *   note: string,
 *   recipe: object|null
 * }>}
 */
export function buildPastMealPresets(cookedMeals, recipeMap, query = '') {
  const safeMeals = Array.isArray(cookedMeals) ? cookedMeals : [];
  if (safeMeals.length === 0) return [];

  const sortedDesc = [...safeMeals].sort((a, b) => {
    const dateCmp = String(b?.date || '').localeCompare(String(a?.date || ''));
    if (dateCmp !== 0) return dateCmp;
    return String(b?.time || '').localeCompare(String(a?.time || ''));
  });

  const getRecipe = (id) => {
    if (!id) return null;
    return recipeMap instanceof Map ? recipeMap.get(id) ?? null : recipeMap?.[id] ?? null;
  };

  const byKey = new Map();

  for (const meal of sortedDesc) {
    if (!meal || typeof meal !== 'object') continue;
    const recipe = getRecipe(meal.recipeId);
    const displayName = recipe?.name || meal.recipeName || 'Recipe unavailable';
    const key =
      typeof meal.recipeId === 'string' && meal.recipeId.trim()
        ? meal.recipeId.trim()
        : `name:${displayName.toLowerCase()}`;

    const existing = byKey.get(key);
    if (!existing) {
      const servingsNum = Number(meal.servings);
      const proteinRaw = meal.proteinPerServing ?? recipe?.nutritionPerServing?.protein;
      const proteinNum =
        typeof proteinRaw === 'number' && Number.isFinite(proteinRaw) ? proteinRaw : null;

      byKey.set(key, {
        key,
        recipeId: String(meal.recipeId || ''),
        recipeName: displayName,
        diet: recipe?.diet === 'nonveg' || meal.diet === 'nonveg' ? 'nonveg' : 'veg',
        mealType: meal.mealType || recipe?.mealTypes?.[0] || 'lunch',
        servings: Number.isFinite(servingsNum) && servingsNum > 0 ? servingsNum : 1,
        proteinPerServing: proteinNum,
        lastCookedDate: String(meal.date || ''),
        lastCookedTime: String(meal.time || ''),
        timesCooked: 1,
        note: typeof meal.note === 'string' ? meal.note : '',
        recipe,
      });
    } else {
      existing.timesCooked += 1;
    }
  }

  const trimmedQuery = String(query ?? '').trim().toLowerCase();
  const presets = Array.from(byKey.values());

  if (!trimmedQuery) {
    return presets;
  }

  const tokens = trimmedQuery.split(/\s+/).filter(Boolean);

  return presets
    .filter((preset) => {
      const haystackParts = [
        preset.recipeName,
        preset.mealType,
        preset.note,
        preset.recipe?.cuisine || '',
        ...(Array.isArray(preset.recipe?.tags) ? preset.recipe.tags : []),
        ...(Array.isArray(preset.recipe?.ingredients)
          ? preset.recipe.ingredients.map((i) => String(i?.ingredientId || '').replace(/_/g, ' '))
          : []),
      ];
      const haystack = haystackParts.join(' ').toLowerCase();
      return tokens.every((tok) => haystack.includes(tok));
    })
    .sort((a, b) => {
      const nameA = a.recipeName.toLowerCase();
      const nameB = b.recipeName.toLowerCase();
      const startsA = nameA.startsWith(trimmedQuery) ? 0 : nameA.includes(trimmedQuery) ? 1 : 2;
      const startsB = nameB.startsWith(trimmedQuery) ? 0 : nameB.includes(trimmedQuery) ? 1 : 2;
      if (startsA !== startsB) return startsA - startsB;
      const dateCmp = b.lastCookedDate.localeCompare(a.lastCookedDate);
      if (dateCmp !== 0) return dateCmp;
      return nameA.localeCompare(nameB);
    });
}

/**
 * Construct a new CookedMeal object from a past meal preset and user selections.
 * @param {{
 *   preset: object,
 *   date: string,
 *   time: string,
 *   mealType?: 'breakfast'|'lunch'|'snacks'|'dinner',
 *   servings?: number,
 *   note?: string,
 *   id?: string
 * }} params
 */
export function createQuickAddedMeal({
  preset,
  date,
  time,
  mealType,
  servings,
  note,
  id,
}) {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))
    ? String(date)
    : formatDate(new Date());
  const safeTime = /^\d{2}:\d{2}$/.test(String(time || '')) ? String(time) : '12:00';
  const validMealTypes = new Set(['breakfast', 'lunch', 'snacks', 'dinner']);
  const resolvedMealType = validMealTypes.has(mealType)
    ? mealType
    : validMealTypes.has(preset?.mealType)
    ? preset.mealType
    : 'lunch';
  const parsedServings = Number(servings ?? preset?.servings ?? 1);
  const safeServings =
    Number.isFinite(parsedServings) && parsedServings > 0
      ? Math.round(parsedServings * 100) / 100
      : 1;
  const cleanNote = typeof note === 'string' && note.trim() ? note.trim().slice(0, 200) : undefined;

  return {
    id:
      typeof id === 'string' && id.trim()
        ? id.trim()
        : `meal_quick_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recipeId: String(preset?.recipeId || ''),
    recipeName: String(preset?.recipeName || 'Recipe unavailable'),
    date: safeDate,
    time: safeTime,
    mealType: resolvedMealType,
    diet: preset?.diet === 'nonveg' ? 'nonveg' : 'veg',
    servings: safeServings,
    proteinPerServing:
      typeof preset?.proteinPerServing === 'number' && Number.isFinite(preset.proteinPerServing)
        ? preset.proteinPerServing
        : undefined,
    note: cleanNote,
  };
}

// Self-tests
(function runCalendarHelperTests() {
  const grid = getMonthGrid(2026, 10); // November 2026
  console.assert(grid.length === 42, `Expected 42 cells, got ${grid.length}`);
  console.assert(
    grid[0].date.getDay() === 1,
    `Expected week to start on Monday (1), got ${grid[0].date.getDay()}`
  );
  console.assert(
    grid[6].date.getDay() === 0,
    `Expected week to end on Sunday (0), got ${grid[6].date.getDay()}`
  );

  const grouped = groupMealsByDate([
    { id: '2', date: '2026-11-17', time: '20:00', recipeId: 'palak_paneer' },
    { id: '1', date: '2026-11-17', time: '08:30', recipeId: 'poha' },
    { id: '3', date: '2026-11-16', time: '13:00', recipeId: 'dal_tadka' },
  ]);

  console.assert(
    Object.keys(grouped).length === 2,
    'Expected 2 date buckets in groupMealsByDate'
  );
  console.assert(
    grouped['2026-11-17'].length === 2 &&
      grouped['2026-11-17'][0].id === '1' &&
      grouped['2026-11-17'][1].id === '2',
    'Expected 2026-11-17 meals to be grouped and sorted by time'
  );

  // Quick Add past meal presets & meal builder self-tests
  const sampleRecipeMap = new Map([
    [
      'poha',
      {
        id: 'poha',
        name: 'Kanda Poha',
        cuisine: 'Maharashtrian',
        diet: 'veg',
        mealTypes: ['breakfast'],
        tags: ['quick', 'light'],
        nutritionPerServing: { protein: 6 },
      },
    ],
    [
      'dal_tadka',
      {
        id: 'dal_tadka',
        name: 'Dal Tadka',
        cuisine: 'North Indian',
        diet: 'veg',
        mealTypes: ['lunch', 'dinner'],
        tags: ['comfort'],
        nutritionPerServing: { protein: 12 },
      },
    ],
  ]);

  const samplePastMeals = [
    {
      id: 'm1',
      recipeId: 'poha',
      date: '2026-11-10',
      time: '08:30',
      mealType: 'breakfast',
      diet: 'veg',
      servings: 2,
    },
    {
      id: 'm2',
      recipeId: 'dal_tadka',
      date: '2026-11-18',
      time: '20:00',
      mealType: 'dinner',
      diet: 'veg',
      servings: 3,
    },
    {
      id: 'm3',
      recipeId: 'poha',
      date: '2026-11-19',
      time: '09:00',
      mealType: 'breakfast',
      diet: 'veg',
      servings: 2.5,
      note: 'extra peanuts',
    },
  ];

  const allPresets = buildPastMealPresets(samplePastMeals, sampleRecipeMap, '');
  console.assert(
    allPresets.length === 2 &&
      allPresets[0].recipeId === 'poha' &&
      allPresets[0].timesCooked === 2 &&
      allPresets[0].servings === 2.5 &&
      allPresets[1].recipeId === 'dal_tadka',
    `Unexpected buildPastMealPresets result: ${JSON.stringify(allPresets)}`
  );

  const searchPoha = buildPastMealPresets(samplePastMeals, sampleRecipeMap, 'peanuts');
  console.assert(
    searchPoha.length === 1 && searchPoha[0].recipeId === 'poha',
    'Expected search query to match meal notes and recipe metadata'
  );

  const builtMeal = createQuickAddedMeal({
    preset: allPresets[0],
    date: '2026-11-21',
    time: '08:45',
    id: 'quick_test_1',
  });
  console.assert(
    builtMeal.id === 'quick_test_1' &&
      builtMeal.recipeId === 'poha' &&
      builtMeal.recipeName === 'Kanda Poha' &&
      builtMeal.date === '2026-11-21' &&
      builtMeal.time === '08:45' &&
      builtMeal.servings === 2.5 &&
      builtMeal.proteinPerServing === 6,
    `Unexpected createQuickAddedMeal result: ${JSON.stringify(builtMeal)}`
  );
})();
