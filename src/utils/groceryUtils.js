// Pure grocery list utilities: scaling, merging, category grouping, and plain-text export.
import { getIngredientById, RECIPES, scaleServings } from '../recipes.js';
import { estimateListCost, formatInr } from './budgetUtils.js';
import { DEFAULT_PRICES } from './priceDefaults.js';

export const GROCERY_CATEGORIES = [
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'meat_fish', label: 'Meat & Fish' },
  { id: 'eggs_dairy', label: 'Eggs & Dairy' },
  { id: 'grains_pulses', label: 'Grains & Pulses' },
  { id: 'spices_herbs', label: 'Spices & Herbs' },
  { id: 'pantry', label: 'Pantry' },
];

export const GROCERY_AISLE_ORDER = [
  'vegetables',
  'fruits',
  'eggs_dairy',
  'meat_fish',
  'grains_pulses',
  'spices_herbs',
  'pantry',
];

export const GROCERY_SORT_OPTIONS = [
  { id: 'aisle', label: 'Aisles' },
  { id: 'checked_last', label: 'Checked last' },
  { id: 'name_az', label: 'A-Z' },
  { id: 'category_az', label: 'Category (A-Z)' },
  { id: 'category_count', label: 'Category (Most items)' },
  { id: 'added_order', label: 'Added order' },
];

const CATEGORY_ORDER = GROCERY_CATEGORIES.map((c) => c.id);
const CATEGORY_LABEL_MAP = new Map(GROCERY_CATEGORIES.map((c) => [c.id, c.label]));

export function normalizeStoreOrder(order) {
  if (!Array.isArray(order) || order.length === 0) {
    return [...GROCERY_AISLE_ORDER];
  }
  const seen = new Set();
  const valid = [];
  for (const id of order) {
    if (typeof id === 'string' && CATEGORY_LABEL_MAP.has(id) && !seen.has(id)) {
      seen.add(id);
      valid.push(id);
    }
  }
  if (valid.length === 0) {
    return [...GROCERY_AISLE_ORDER];
  }
  for (const fallbackId of GROCERY_AISLE_ORDER) {
    if (!seen.has(fallbackId)) {
      valid.push(fallbackId);
    }
  }
  return valid;
}

export function getCategoryLabel(categoryId) {
  const key = typeof categoryId === 'string' ? categoryId.trim().toLowerCase() : '';
  return CATEGORY_LABEL_MAP.get(key) || 'Pantry';
}

/**
 * Parse a quantity string like "2 pcs" or "1.5 tbsp" into numeric amount and normalized unit.
 * @param {string} quantityText
 * @returns {{ amount: number|null, unit: string }}
 */
function parseQuantityText(quantityText) {
  const raw = String(quantityText ?? '').trim();
  if (!raw || raw === '-') {
    return { amount: null, unit: '' };
  }
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) {
    return { amount: null, unit: raw.toLowerCase() };
  }
  const amount = Number(match[1]);
  const unit = match[2].trim();
  return {
    amount: Number.isFinite(amount) ? amount : null,
    unit,
  };
}

/**
 * Format a numeric amount and unit cleanly into display text.
 * @param {number} amount
 * @param {string} unit
 * @returns {string}
 */
function formatQuantityText(amount, unit) {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return unit ? unit : '-';
  }
  const rounded = Math.round(amount * 100) / 100;
  const numStr = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return unit ? `${numStr} ${unit}`.trim() : numStr;
}

function makeItemId(ingredientId, unit) {
  const safeUnit = String(unit || 'unit')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
  return `${ingredientId}__${safeUnit}`;
}

/**
 * Merge a single grocery item into an existing list.
 * Sums quantities when ingredientId and unit match (unless the exact same recipeId already added it).
 * Keeps separate rows when units differ.
 * @param {Array<object>} list
 * @param {object} item
 * @returns {Array<object>}
 */
export function mergeItem(list, item) {
  const safeList = Array.isArray(list) ? list : [];
  if (!item || !item.ingredientId) return safeList;

  const catalog = getIngredientById(item.ingredientId);
  const name = item.name || catalog?.name || item.ingredientId;
  const category = item.category || catalog?.category || 'pantry';
  const incomingRecipeIds = Array.isArray(item.fromRecipeIds)
    ? item.fromRecipeIds.filter((r) => typeof r === 'string' && r.trim().length > 0)
    : [];

  const parsedIncoming = parseQuantityText(item.quantityText);
  const incomingUnitLower = parsedIncoming.unit.toLowerCase();

  const matchIndex = safeList.findIndex((existing) => {
    if (existing.ingredientId !== item.ingredientId) return false;
    const parsedExisting = parseQuantityText(existing.quantityText);
    return parsedExisting.unit.toLowerCase() === incomingUnitLower;
  });

  if (matchIndex === -1) {
    const baseId = item.id || makeItemId(item.ingredientId, parsedIncoming.unit);
    const uniqueId = safeList.some((x) => x.id === baseId)
      ? `${baseId}_${safeList.length + 1}`
      : baseId;

    return [
      ...safeList,
      {
        id: uniqueId,
        name,
        ingredientId: item.ingredientId,
        category,
        quantityText: item.quantityText || '-',
        checked: Boolean(item.checked),
        fromRecipeIds: Array.from(new Set(incomingRecipeIds)),
      },
    ];
  }

  const existing = safeList[matchIndex];
  const existingRecipeSet = new Set(existing.fromRecipeIds || []);

  // If every incoming recipeId is already accounted for on this row, keep unchanged
  if (
    incomingRecipeIds.length > 0 &&
    incomingRecipeIds.every((rid) => existingRecipeSet.has(rid))
  ) {
    return safeList;
  }

  const parsedExisting = parseQuantityText(existing.quantityText);
  let nextQuantityText = existing.quantityText || '-';
  if (parsedExisting.amount !== null && parsedIncoming.amount !== null) {
    nextQuantityText = formatQuantityText(
      parsedExisting.amount + parsedIncoming.amount,
      parsedExisting.unit || parsedIncoming.unit
    );
  }

  const mergedRecipeIds = Array.from(
    new Set([...(existing.fromRecipeIds || []), ...incomingRecipeIds])
  );

  const updatedRow = {
    ...existing,
    name,
    category,
    quantityText: nextQuantityText,
    checked: false, // New addition resets checked state so shopper buys updated amount
    fromRecipeIds: mergedRecipeIds,
  };

  return safeList.map((row, idx) => (idx === matchIndex ? updatedRow : row));
}

/**
 * Add missing scaled ingredients from a recipe into the grocery list.
 * Skips owned ingredients and skips optional ingredients unless includeOptional is true.
 * @param {Array<object>} list
 * @param {object} recipe
 * @param {object} household
 * @param {boolean} [includeOptional=false]
 * @param {Array<string>} [ownedIngredientIds]
 * @returns {Array<object>}
 */
export function addRecipeItems(
  list,
  recipe,
  household,
  includeOptional = false,
  ownedIngredientIds
) {
  const safeList = Array.isArray(list) ? list : [];
  if (!recipe || !Array.isArray(recipe.ingredients)) return safeList;

  const scaled = scaleServings(recipe, household);
  const hasExplicitOwned = Array.isArray(ownedIngredientIds);
  const ownedSet = new Set(hasExplicitOwned ? ownedIngredientIds : []);

  // When called with a RecipeMatch and no explicit ownedIngredientIds override, honor haveIngredients
  if (!hasExplicitOwned && Array.isArray(recipe.haveIngredients)) {
    for (const h of recipe.haveIngredients) {
      if (h?.ingredientId) ownedSet.add(h.ingredientId);
    }
  }

  let nextList = safeList;

  for (const ingItem of scaled.ingredients) {
    if (ingItem.optional && !includeOptional) continue;

    const catalog = getIngredientById(ingItem.ingredientId);
    const isOwned =
      Boolean(catalog?.assumedAvailable) || ownedSet.has(ingItem.ingredientId);
    if (isOwned) continue;

    const quantityText = formatQuantityText(ingItem.scaledAmount, ingItem.unit);
    nextList = mergeItem(nextList, {
      ingredientId: ingItem.ingredientId,
      name: catalog?.name || ingItem.ingredientId,
      category: catalog?.category || 'pantry',
      quantityText,
      checked: false,
      fromRecipeIds: recipe.id ? [recipe.id] : [],
    });
  }

  return nextList;
}

/**
 * Count how many missing (non-owned, non-assumedAvailable) ingredients a recipe needs.
 * Skips optional ingredients unless includeOptional is true.
 * @param {object} recipe
 * @param {Array<string>} [ownedIngredientIds]
 * @param {boolean} [includeOptional=false]
 * @returns {number}
 */
export function getMissingRecipeIngredientsCount(
  recipe,
  ownedIngredientIds,
  includeOptional = false
) {
  if (!recipe || !Array.isArray(recipe.ingredients)) return 0;
  const hasExplicitOwned = Array.isArray(ownedIngredientIds);
  const ownedSet = new Set(hasExplicitOwned ? ownedIngredientIds : []);

  if (!hasExplicitOwned && Array.isArray(recipe.haveIngredients)) {
    for (const h of recipe.haveIngredients) {
      if (h?.ingredientId) ownedSet.add(h.ingredientId);
    }
  }

  let count = 0;
  for (const ingItem of recipe.ingredients) {
    if (ingItem.optional && !includeOptional) continue;
    const catalog = getIngredientById(ingItem.ingredientId);
    const isOwned =
      Boolean(catalog?.assumedAvailable) || ownedSet.has(ingItem.ingredientId);
    if (!isOwned) count += 1;
  }
  return count;
}

/**
 * Group grocery items by category in canonical order, hiding empty groups.
 * Checked items always sort to the bottom of their category group.
 * @param {Array<object>} list
 * @returns {Array<{ category: string, label: string, items: Array<object> }>}
 */
export function groupByCategory(list) {
  const safeList = Array.isArray(list) ? list : [];
  const buckets = new Map();

  for (const item of safeList) {
    if (!item) continue;
    const rawCat = typeof item.category === 'string' ? item.category.trim().toLowerCase() : '';
    const catKey = CATEGORY_LABEL_MAP.has(rawCat) ? rawCat : 'pantry';
    if (!buckets.has(catKey)) {
      buckets.set(catKey, []);
    }
    buckets.get(catKey).push(item);
  }

  const groups = [];
  for (const catId of CATEGORY_ORDER) {
    const rawItems = buckets.get(catId);
    if (!rawItems || rawItems.length === 0) continue;

    // Sort unchecked first, checked last (preserving relative order within each half)
    const unchecked = rawItems.filter((i) => !i.checked);
    const checked = rawItems.filter((i) => Boolean(i.checked));

    groups.push({
      category: catId,
      label: CATEGORY_LABEL_MAP.get(catId) || catId,
      items: [...unchecked, ...checked],
    });
  }

  return groups;
}

/**
 * Sort and optionally filter grocery items by category or name for shopping convenience.
 * Checked items always sort to the bottom of their section.
 * @param {Array<object>} list
 * @param {{ sortBy?: string, selectedCategory?: string, categoryOrder?: Array<string> }} [options]
 * @returns {{ mode: 'grouped'|'flat', groups: Array<{ category: string, label: string, items: Array<object> }>, items: Array<object>, availableCategories: Array<{ id: string, label: string, count: number, uncheckedCount: number }> }}
 */
export function sortAndGroupGroceryItems(list, options = {}) {
  const safeList = Array.isArray(list) ? list : [];
  const sortBy = options?.sortBy || 'aisle';
  const selectedCategory = options?.selectedCategory || 'all';
  const orderedCategoryIds = normalizeStoreOrder(options?.categoryOrder);

  // Build available category counts across the full list (using normalized customOrder for aisle consistency)
  const countsMap = new Map();
  for (const item of safeList) {
    if (!item) continue;
    const rawCat = typeof item.category === 'string' ? item.category.trim().toLowerCase() : '';
    const catKey = CATEGORY_LABEL_MAP.has(rawCat) ? rawCat : 'pantry';
    const current = countsMap.get(catKey) || { count: 0, uncheckedCount: 0 };
    current.count += 1;
    if (!item.checked) current.uncheckedCount += 1;
    countsMap.set(catKey, current);
  }

  const availableCategories = orderedCategoryIds
    .filter((id) => countsMap.has(id))
    .map((id) => {
      const counts = countsMap.get(id);
      return {
        id,
        label: CATEGORY_LABEL_MAP.get(id) || id,
        count: counts.count,
        uncheckedCount: counts.uncheckedCount,
      };
    });

  const filtered =
    selectedCategory && selectedCategory !== 'all'
      ? safeList.filter((item) => {
          if (!item) return false;
          const rawCat = typeof item.category === 'string' ? item.category.trim().toLowerCase() : '';
          const catKey = CATEGORY_LABEL_MAP.has(rawCat) ? rawCat : 'pantry';
          return catKey === selectedCategory;
        })
      : safeList.filter(Boolean);

  if (sortBy === 'name_az' || sortBy === 'added_order' || sortBy === 'checked_last') {
    const unchecked = filtered.filter((i) => !i.checked);
    const checked = filtered.filter((i) => Boolean(i.checked));
    const sortByName = (a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''));

    const aisleIndex = new Map(orderedCategoryIds.map((id, idx) => [id, idx]));
    const sortByAisleThenName = (a, b) => {
      const catA = aisleIndex.get(a.category) ?? 99;
      const catB = aisleIndex.get(b.category) ?? 99;
      if (catA !== catB) return catA - catB;
      return sortByName(a, b);
    };

    const sortedItems =
      sortBy === 'name_az'
        ? [...unchecked.sort(sortByName), ...checked.sort(sortByName)]
        : sortBy === 'checked_last'
        ? [...unchecked.sort(sortByAisleThenName), ...checked.sort(sortByAisleThenName)]
        : [...unchecked, ...checked];

    return {
      mode: 'flat',
      groups: [
        {
          category: selectedCategory !== 'all' ? selectedCategory : 'all',
          label:
            selectedCategory !== 'all'
              ? getCategoryLabel(selectedCategory)
              : sortBy === 'name_az'
              ? 'All items (A-Z)'
              : sortBy === 'checked_last'
              ? 'To buy first, checked last'
              : 'All items (Added order)',
          items: sortedItems,
        },
      ],
      items: sortedItems,
      availableCategories,
    };
  }

  const buckets = new Map();
  for (const item of filtered) {
    const rawCat = typeof item.category === 'string' ? item.category.trim().toLowerCase() : '';
    const catKey = CATEGORY_LABEL_MAP.has(rawCat) ? rawCat : 'pantry';
    if (!buckets.has(catKey)) buckets.set(catKey, []);
    buckets.get(catKey).push(item);
  }

  const groupObjects = [];
  for (const catId of orderedCategoryIds) {
    const rawItems = buckets.get(catId);
    if (!rawItems || rawItems.length === 0) continue;
    const unchecked = rawItems
      .filter((i) => !i.checked)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const checked = rawItems
      .filter((i) => Boolean(i.checked))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    groupObjects.push({
      category: catId,
      label: CATEGORY_LABEL_MAP.get(catId) || catId,
      uncheckedCount: unchecked.length,
      items: [...unchecked, ...checked],
    });
  }

  if (sortBy === 'category_az') {
    groupObjects.sort((a, b) => a.label.localeCompare(b.label));
  } else if (sortBy === 'category_count') {
    groupObjects.sort((a, b) => {
      if (b.uncheckedCount !== a.uncheckedCount) {
        return b.uncheckedCount - a.uncheckedCount;
      }
      if (b.items.length !== a.items.length) {
        return b.items.length - a.items.length;
      }
      return a.label.localeCompare(b.label);
    });
  }

  const groups = groupObjects.map(({ category, label, items }) => ({
    category,
    label,
    items,
  }));

  return {
    mode: 'grouped',
    groups,
    items: groups.flatMap((g) => g.items),
    availableCategories,
  };
}

/**
 * Format the grocery list as grouped plain text (one item per line) for clipboard copy.
 * When options.showCost is true, appends per-item cost (or "(no price)") and the
 * "Estimated total: ₹ 412 (estimate)" footer line.
 * @param {Array<object>} list
 * @param {{ showCost?: boolean, prices?: Record<string, { perUnitPaise: number, unit: string }>, sortBy?: string, selectedCategory?: string, categoryOrder?: Array<string> }} [options]
 * @returns {string}
 */
export function toPlainText(list, options = {}) {
  const hasCustomSort =
    Boolean(options?.sortBy) ||
    Boolean(options?.selectedCategory && options.selectedCategory !== 'all') ||
    Array.isArray(options?.categoryOrder);
  const groups = hasCustomSort
    ? sortAndGroupGroceryItems(list, options).groups
    : groupByCategory(list);
  if (groups.length === 0) return '';

  const showCost = Boolean(options?.showCost);
  const prices = options?.prices || DEFAULT_PRICES;
  const costSummary = showCost ? estimateListCost(list, prices) : null;
  const lineCostById = new Map(
    (costSummary?.lines || []).map((line) => [line.id, line.paise])
  );

  const body = groups
    .map((group) => {
      const header = group.label;
      const lines = group.items.map((item) => {
        const mark = item.checked ? '[x]' : '[ ]';
        const qty =
          item.quantityText && item.quantityText !== '-' ? ` (${item.quantityText})` : '';
        if (!showCost) {
          return `${mark} ${item.name || '-'}${qty}`;
        }
        const paise = lineCostById.get(String(item.id || '')) ?? null;
        const priceSuffix =
          paise !== null ? ` — ${formatInr(paise)}` : ' (no price)';
        return `${mark} ${item.name || '-'}${qty}${priceSuffix}`;
      });
      return `${header}\n${lines.join('\n')}`;
    })
    .join('\n\n');

  if (!showCost || !costSummary) {
    return body;
  }

  const totalStr =
    costSummary.knownCount > 0 ? formatInr(costSummary.totalPaise) : '-';
  return `${body}\n\nEstimated total: ${totalStr} (estimate)`;
}

// Self-tests
(function runSelfTests() {
  // 1. Merging same ingredient with matching units sums amounts and combines fromRecipeIds
  let list = [];
  list = mergeItem(list, {
    ingredientId: 'onion',
    name: 'Onion',
    category: 'vegetables',
    quantityText: '2 pcs',
    checked: false,
    fromRecipeIds: ['recipe_a'],
  });
  list = mergeItem(list, {
    ingredientId: 'onion',
    name: 'Onion',
    category: 'vegetables',
    quantityText: '1.5 pcs',
    checked: false,
    fromRecipeIds: ['recipe_b'],
  });
  console.assert(list.length === 1, `Expected 1 merged row, got ${list.length}`);
  console.assert(list[0].quantityText === '3.5 pcs', `Expected "3.5 pcs", got "${list[0].quantityText}"`);
  console.assert(
    list[0].fromRecipeIds.length === 2 &&
      list[0].fromRecipeIds.includes('recipe_a') &&
      list[0].fromRecipeIds.includes('recipe_b'),
    'Expected both recipe IDs on merged row'
  );

  // 2. Mismatched units keep separate rows
  list = mergeItem(list, {
    ingredientId: 'onion',
    name: 'Onion',
    category: 'vegetables',
    quantityText: '100 g',
    checked: false,
    fromRecipeIds: ['recipe_c'],
  });
  console.assert(list.length === 2, `Expected 2 rows for mismatched units, got ${list.length}`);

  // 3. Checked items sort last within a group
  const grouped = groupByCategory([
    {
      id: '1',
      ingredientId: 'tomato',
      name: 'Tomato',
      category: 'vegetables',
      quantityText: '2 pcs',
      checked: true,
      fromRecipeIds: ['recipe_a'],
    },
    {
      id: '2',
      ingredientId: 'spinach',
      name: 'Spinach',
      category: 'vegetables',
      quantityText: '1 bunch',
      checked: false,
      fromRecipeIds: ['recipe_a'],
    },
  ]);
  console.assert(grouped.length === 1, 'Expected 1 category group');
  console.assert(
    grouped[0].items[0].ingredientId === 'spinach' && grouped[0].items[1].checked === true,
    'Expected checked item sorted last within group'
  );

  // 4. addRecipeItems skips owned & optional when includeOptional=false
  const poha = RECIPES.find((r) => r.id === 'poha');
  if (poha) {
    const added = addRecipeItems([], poha, { adults: 2, children: [] }, false, ['onion']);
    console.assert(
      !added.some((i) => i.ingredientId === 'onion') &&
        !added.some((i) => i.ingredientId === 'peanuts'),
      'Expected owned and optional ingredients to be skipped'
    );
    console.assert(
      added.some((i) => i.ingredientId === 'poha'),
      'Expected missing required ingredient poha to be added'
    );
  }

  // 5. toPlainText with showCost includes Estimated total and (no price)
  const plainWithCost = toPlainText(
    [
      {
        id: 'onion__pcs',
        ingredientId: 'onion',
        name: 'Onion',
        category: 'vegetables',
        quantityText: '2 pcs',
        checked: false,
        fromRecipeIds: [],
      },
      {
        id: 'bread__slices',
        ingredientId: 'bread',
        name: 'Bread Slices',
        category: 'grains_pulses',
        quantityText: '4 slices',
        checked: false,
        fromRecipeIds: [],
      },
    ],
    {
      showCost: true,
      prices: {
        onion: { perUnitPaise: 600, unit: 'pcs' },
        bread: { perUnitPaise: 4500, unit: 'pack' },
      },
    }
  );
  console.assert(
    plainWithCost.includes('(no price)') &&
      plainWithCost.includes('Estimated total: ₹ 12 (estimate)'),
    `Expected cost footer and (no price) in plain text, got:\n${plainWithCost}`
  );

  // 6. sortAndGroupGroceryItems supports category_az, category_count, and category filtering
  const sortedSample = [
    { id: 'a', ingredientId: 'onion', name: 'Onion', category: 'vegetables', quantityText: '2 pcs', checked: false, fromRecipeIds: [] },
    { id: 'b', ingredientId: 'milk', name: 'Milk', category: 'eggs_dairy', quantityText: '1 l', checked: false, fromRecipeIds: [] },
    { id: 'c', ingredientId: 'yogurt', name: 'Yogurt / Curd', category: 'eggs_dairy', quantityText: '1 cup', checked: false, fromRecipeIds: [] },
    { id: 'd', ingredientId: 'oil', name: 'Cooking Oil', category: 'pantry', quantityText: '1 tbsp', checked: false, fromRecipeIds: [] },
  ];
  const byCount = sortAndGroupGroceryItems(sortedSample, { sortBy: 'category_count' });
  console.assert(
    byCount.groups[0]?.category === 'eggs_dairy',
    'Expected eggs_dairy (2 items) first in category_count sort'
  );
  const byCatAz = sortAndGroupGroceryItems(sortedSample, { sortBy: 'category_az' });
  console.assert(
    byCatAz.groups[0]?.category === 'eggs_dairy' && byCatAz.groups[2]?.category === 'vegetables',
    'Expected Eggs & Dairy -> Pantry -> Vegetables in category_az sort'
  );
  const filteredDairy = sortAndGroupGroceryItems(sortedSample, {
    sortBy: 'aisle',
    selectedCategory: 'eggs_dairy',
  });
  console.assert(
    filteredDairy.groups.length === 1 && filteredDairy.items.length === 2,
    'Expected selectedCategory filter to narrow items to Eggs & Dairy'
  );

  // 7. normalizeStoreOrder falls back gracefully and checked_last keeps checked items at bottom
  console.assert(
    normalizeStoreOrder(['bad_cat']).join(',') === GROCERY_AISLE_ORDER.join(','),
    'Invalid store order should fall back to GROCERY_AISLE_ORDER'
  );
  const customAisle = sortAndGroupGroceryItems(sortedSample, {
    sortBy: 'aisle',
    categoryOrder: ['pantry', 'eggs_dairy', 'vegetables'],
  });
  console.assert(
    customAisle.groups[0]?.category === 'pantry',
    'Custom storeOrder should put pantry first'
  );
  const checkedLastSample = [
    { id: 'c1', ingredientId: 'onion', name: 'Onion', category: 'vegetables', quantityText: '1', checked: true, fromRecipeIds: [] },
    { id: 'c2', ingredientId: 'milk', name: 'Milk', category: 'eggs_dairy', quantityText: '1', checked: false, fromRecipeIds: [] },
  ];
  const checkedLastRes = sortAndGroupGroceryItems(checkedLastSample, { sortBy: 'checked_last' });
  console.assert(
    checkedLastRes.items[0]?.id === 'c2' && checkedLastRes.items[1]?.id === 'c1',
    'Checked last mode should place all unchecked items before checked items'
  );
})();
