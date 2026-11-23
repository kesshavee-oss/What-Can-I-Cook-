// Pure shopping budget math, unit conversion, INR currency formatting, and input validation.
import { INGREDIENTS } from '../recipes.js';
import { DEFAULT_PRICES } from './priceDefaults.js';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const UNIT_ALIASES = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'litre',
  litre: 'litre',
  litres: 'litre',
  liter: 'litre',
  liters: 'litre',
  pc: 'pcs',
  pcs: 'pcs',
  piece: 'pcs',
  pieces: 'pcs',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  pack: 'pack',
  packs: 'pack',
  packet: 'pack',
  packets: 'pack',
  cup: 'cup',
  cups: 'cup',
  slice: 'slices',
  slices: 'slices',
  clove: 'cloves',
  cloves: 'cloves',
  leaf: 'leaves',
  leaves: 'leaves',
  bunch: 'bunch',
  bunches: 'bunch',
};

/**
 * Normalize unit text into canonical unit keys used by cost estimation.
 * @param {unknown} unit
 * @returns {string}
 */
export function normalizePriceUnit(unit) {
  const cleaned = String(unit ?? '').trim().toLowerCase();
  if (!cleaned) return '';
  return UNIT_ALIASES[cleaned] || cleaned;
}

/**
 * Parse a grocery quantity string such as "500 g" or "2 pcs" into numeric amount and unit.
 * @param {unknown} quantityText
 * @returns {{ amount: number|null, unit: string }}
 */
export function parseGroceryQuantity(quantityText) {
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
    amount: Number.isFinite(amount) && amount > 0 ? amount : null,
    unit,
  };
}

/**
 * Compute conversion factor from sourceUnit to targetUnit, or null when unsupported.
 * Supported conversions: g <-> kg, ml <-> litre, tsp (5 g) & tbsp (15 g) -> g/kg, pcs -> pcs,
 * and identical normalized units. Never guesses incompatible units (e.g. cup -> kg).
 * @param {string} sourceUnit
 * @param {string} targetUnit
 * @returns {number|null}
 */
export function getUnitConversionFactor(sourceUnit, targetUnit) {
  const from = normalizePriceUnit(sourceUnit);
  const to = normalizePriceUnit(targetUnit);
  if (!from || !to) return null;

  if (from === to) return 1;
  if (from === 'g' && to === 'kg') return 0.001;
  if (from === 'kg' && to === 'g') return 1000;
  if (from === 'ml' && to === 'litre') return 0.001;
  if (from === 'litre' && to === 'ml') return 1000;
  if (from === 'tsp' && to === 'g') return 5;
  if (from === 'tsp' && to === 'kg') return 0.005;
  if (from === 'tbsp' && to === 'g') return 15;
  if (from === 'tbsp' && to === 'kg') return 0.015;

  return null;
}

/**
 * Merge user price overrides on top of DEFAULT_PRICES cleanly.
 * @param {Record<string, { perUnitPaise: number, unit: string }>} [overrides]
 * @returns {Record<string, { perUnitPaise: number, unit: string }>}
 */
export function mergePricesWithDefaults(overrides = {}) {
  const merged = { ...DEFAULT_PRICES };
  if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
    for (const [id, entry] of Object.entries(overrides)) {
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.perUnitPaise === 'number' &&
        Number.isInteger(entry.perUnitPaise) &&
        entry.perUnitPaise > 0 &&
        typeof entry.unit === 'string' &&
        entry.unit.trim().length > 0
      ) {
        merged[id] = {
          perUnitPaise: entry.perUnitPaise,
          unit: entry.unit.trim(),
        };
      }
    }
  }
  return merged;
}

/**
 * Estimate cost in integer paise for a single ingredient quantity.
 * Returns null if the unit cannot be converted or the price entry is missing/invalid.
 * @param {string} ingredientId
 * @param {number} quantityBase
 * @param {string} unitBase
 * @param {Record<string, { perUnitPaise: number, unit: string }>} [prices]
 * @returns {number|null}
 */
export function estimateItemCost(ingredientId, quantityBase, unitBase, prices = DEFAULT_PRICES) {
  if (typeof ingredientId !== 'string' || !ingredientId.trim()) return null;
  const qty = Number(quantityBase);
  if (!Number.isFinite(qty) || qty <= 0) return null;

  const priceMap = prices && typeof prices === 'object' ? prices : DEFAULT_PRICES;
  const priceEntry = priceMap[ingredientId];
  if (!priceEntry || typeof priceEntry !== 'object') return null;

  const perUnitPaise = Number(priceEntry.perUnitPaise);
  if (!Number.isFinite(perUnitPaise) || perUnitPaise <= 0) return null;

  const factor = getUnitConversionFactor(unitBase, priceEntry.unit);
  if (factor === null) return null;

  // Use Math.round to preserve exact integer paise math with zero float drift
  return Math.round(qty * factor * Math.round(perUnitPaise));
}

/**
 * Estimate total cost in integer paise across a grocery list.
 * Unknown items are counted separately in unknownCount and never added as zero.
 * Checked items are subtracted from leftToBuyPaise for the remaining shopping cost.
 * @param {Array<object>} groceryList
 * @param {Record<string, { perUnitPaise: number, unit: string }>} [prices]
 * @returns {{
 *   totalPaise: number,
 *   knownPaise: number,
 *   knownCount: number,
 *   unknownCount: number,
 *   checkedPaise: number,
 *   leftToBuyPaise: number,
 *   leftToBuyUnknownCount: number,
 *   lines: Array<{ id: string, name: string, ingredientId: string, paise: number|null, checked: boolean }>
 * }}
 */
export function estimateListCost(groceryList, prices = DEFAULT_PRICES) {
  const safeList = Array.isArray(groceryList) ? groceryList : [];
  let totalPaise = 0;
  let checkedPaise = 0;
  let knownCount = 0;
  let unknownCount = 0;
  let leftToBuyUnknownCount = 0;
  const lines = [];

  for (const item of safeList) {
    if (!item || typeof item !== 'object') continue;
    const isChecked = Boolean(item.checked);

    let qty = null;
    let unit = '';
    if (typeof item.quantityBase === 'number' && typeof item.unitBase === 'string') {
      qty = item.quantityBase;
      unit = item.unitBase;
    } else if (typeof item.amount === 'number' && typeof item.unit === 'string') {
      qty = item.amount;
      unit = item.unit;
    } else {
      const parsed = parseGroceryQuantity(item.quantityText);
      qty = parsed.amount;
      unit = parsed.unit;
    }

    const paise =
      qty !== null ? estimateItemCost(item.ingredientId, qty, unit, prices) : null;

    if (paise === null) {
      unknownCount += 1;
      if (!isChecked) {
        leftToBuyUnknownCount += 1;
      }
    } else {
      totalPaise += paise;
      knownCount += 1;
      if (isChecked) {
        checkedPaise += paise;
      }
    }

    lines.push({
      id: String(item.id || ''),
      name: String(item.name || item.ingredientId || '-'),
      ingredientId: String(item.ingredientId || ''),
      paise,
      checked: isChecked,
    });
  }

  const leftToBuyPaise = totalPaise - checkedPaise;

  return {
    totalPaise,
    knownPaise: totalPaise,
    knownCount,
    unknownCount,
    checkedPaise,
    leftToBuyPaise,
    leftToBuyUnknownCount,
    lines,
  };
}

/**
 * Estimate weekly cost for missing items needed by planned meals using estimateListCost
 * so numbers agree identically between the Plan and Grocery tabs.
 * @param {Array<object>} missingItems
 * @param {Record<string, { perUnitPaise: number, unit: string }>} [prices]
 */
export function estimatePlanCost(missingItems, prices = DEFAULT_PRICES) {
  return estimateListCost(missingItems, prices);
}

/**
 * Format an integer paise value into rounded INR currency with Indian grouping (e.g. "₹ 1,24,500").
 * Returns "-" when paise is null, undefined, or NaN.
 * @param {number|null|undefined} paise
 * @returns {string}
 */
export function formatInr(paise) {
  if (paise === null || paise === undefined || typeof paise !== 'number' || !Number.isFinite(paise)) {
    return '-';
  }
  const rupees = Math.round(paise / 100);
  return inrFormatter.format(rupees).replace(/^₹\s*/, '₹ ');
}

/**
 * Format integer paise into a rupee string suitable for editing inputs (up to 2 decimal places).
 * @param {number} paise
 * @returns {string}
 */
export function paiseToEditableRupees(paise) {
  if (typeof paise !== 'number' || !Number.isFinite(paise) || paise <= 0) {
    return '';
  }
  const roundedPaise = Math.round(paise);
  if (roundedPaise % 100 === 0) {
    return String(roundedPaise / 100);
  }
  return (roundedPaise / 100).toFixed(2).replace(/0$/, '');
}

/**
 * Validate a rupee price text input (positive number with up to 2 decimal places).
 * Never returns NaN.
 * @param {string} rawValue
 * @returns {{ ok: true, paise: number } | { ok: false, error: string }}
 */
export function validatePriceInput(rawValue) {
  const trimmed = String(rawValue ?? '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Enter a price greater than 0.' };
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    return {
      ok: false,
      error: 'Use a positive number with up to 2 decimal places (e.g. 45 or 45.50).',
    };
  }
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { ok: false, error: 'Price must be greater than 0.' };
  }
  const paise = Math.round(numeric * 100);
  if (!Number.isInteger(paise) || paise <= 0) {
    return { ok: false, error: 'Price must be at least ₹ 0.01.' };
  }
  return { ok: true, paise };
}

function toIsoLocal(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMondayStart(dateInput) {
  const raw =
    dateInput instanceof Date
      ? new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
      : /^\d{4}-\d{2}-\d{2}$/.test(String(dateInput || ''))
      ? new Date(
          Number(String(dateInput).slice(0, 4)),
          Number(String(dateInput).slice(5, 7)) - 1,
          Number(String(dateInput).slice(8, 10))
        )
      : new Date();
  const day = raw.getDay(); // 0=Sun..6=Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  raw.setDate(raw.getDate() + diffToMon);
  return raw;
}

/**
 * Group recorded grocery purchases into the last N Monday-start weeks.
 * Computes weekly average across recorded weeks and the highest-spend week.
 * @param {Array<{ id: string, date: string, totalPaise: number, itemCount: number }>} purchases
 * @param {Date|string} [referenceDate]
 * @param {number} [weeksCount=8]
 */
export function aggregateWeeklyBudgetHistory(purchases, referenceDate = new Date(), weeksCount = 8) {
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const count = Math.max(1, Math.min(24, Number(weeksCount) || 8));
  const currentMonday = getMondayStart(referenceDate);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weeks = [];
  const weekMap = new Map();

  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const weekStartIso = toIsoLocal(start);
    const weekEndIso = toIsoLocal(end);
    const label = `${start.getDate()} ${monthNames[start.getMonth()]}`;
    const bucket = {
      weekStartIso,
      weekEndIso,
      label,
      totalPaise: 0,
      purchaseCount: 0,
      itemCount: 0,
    };
    weeks.push(bucket);
    weekMap.set(weekStartIso, bucket);
  }

  for (const rec of safePurchases) {
    if (!rec || typeof rec.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rec.date)) {
      continue;
    }
    const paise = Number(rec.totalPaise);
    if (!Number.isFinite(paise) || paise < 0) continue;
    const recMondayIso = toIsoLocal(getMondayStart(rec.date));
    const bucket = weekMap.get(recMondayIso);
    if (bucket) {
      bucket.totalPaise += Math.round(paise);
      bucket.purchaseCount += 1;
      bucket.itemCount += Math.max(0, Number(rec.itemCount) || 0);
    }
  }

  const maxWeekPaise = weeks.reduce((m, w) => Math.max(m, w.totalPaise), 0);
  const activeWeeks = weeks.filter((w) => w.totalPaise > 0);
  const weeklyAveragePaise =
    activeWeeks.length > 0
      ? Math.round(activeWeeks.reduce((s, w) => s + w.totalPaise, 0) / activeWeeks.length)
      : null;

  const highestWeek =
    activeWeeks.length > 0
      ? activeWeeks.reduce((best, w) => (w.totalPaise > best.totalPaise ? w : best), activeWeeks[0])
      : null;

  return {
    weeks,
    maxWeekPaise,
    weeklyAveragePaise,
    highestWeek,
    totalRecordedCount: safePurchases.length,
  };
}

// Self-tests
(function runSelfTests() {
  const samplePrices = {
    paneer: { perUnitPaise: 40000, unit: 'kg' }, // ₹ 400 / kg
    onion: { perUnitPaise: 600, unit: 'pcs' }, // ₹ 6 / pc
    turmeric: { perUnitPaise: 25000, unit: 'kg' }, // ₹ 250 / kg
    milk: { perUnitPaise: 6600, unit: 'litre' }, // ₹ 66 / litre
    rice: { perUnitPaise: 9500, unit: 'kg' }, // ₹ 95 / kg
    item_a: { perUnitPaise: 10, unit: 'pcs' },
    item_b: { perUnitPaise: 20, unit: 'pcs' },
  };

  // 1. 500 g of an ingredient priced per kg returns the correct paise
  const paneer500g = estimateItemCost('paneer', 500, 'g', samplePrices);
  console.assert(
    paneer500g === 20000,
    `Expected 500 g paneer at 40000 paise/kg = 20000 paise, got ${paneer500g}`
  );

  // 2. tsp = 5 g and tbsp = 15 g convert to kg, ml converts to litre, pcs stays pcs
  const turmeric2tsp = estimateItemCost('turmeric', 2, 'tsp', samplePrices);
  console.assert(
    turmeric2tsp === 250,
    `Expected 2 tsp (10 g) turmeric at 25000 paise/kg = 250 paise, got ${turmeric2tsp}`
  );
  const milk500ml = estimateItemCost('milk', 500, 'ml', samplePrices);
  console.assert(milk500ml === 3300, `Expected 500 ml milk = 3300 paise, got ${milk500ml}`);
  const onion3pcs = estimateItemCost('onion', 3, 'pcs', samplePrices);
  console.assert(onion3pcs === 1800, `Expected 3 pcs onion = 1800 paise, got ${onion3pcs}`);

  // 3. Unconvertible units return null (never guess)
  console.assert(
    estimateItemCost('rice', 2, 'cup', samplePrices) === null,
    'Unconvertible unit "cup" for kg-priced rice must return null'
  );
  console.assert(
    estimateItemCost('milk', 1, 'tsp', samplePrices) === null,
    'Unconvertible unit "tsp" for litre-priced milk must return null'
  );

  // 4. Unknown items are counted in unknownCount and not added as zero
  const listSummary = estimateListCost(
    [
      { id: '1', ingredientId: 'paneer', name: 'Paneer', quantityText: '500 g', checked: false },
      { id: '2', ingredientId: 'rice', name: 'Rice', quantityText: '2 cup', checked: false },
      { id: '3', ingredientId: 'onion', name: 'Onion', quantityText: '2 pcs', checked: true },
      { id: '4', ingredientId: 'missing_price', name: 'Mystery Spice', quantityText: '1 pack', checked: false },
    ],
    samplePrices
  );
  console.assert(
    listSummary.unknownCount === 2 &&
      listSummary.knownCount === 2 &&
      listSummary.totalPaise === 21200 &&
      listSummary.knownPaise === 21200 &&
      listSummary.leftToBuyPaise === 20000 &&
      listSummary.lines[1].paise === null &&
      listSummary.lines[3].paise === null,
    'Unknown items must increment unknownCount, stay null in lines, and checked items subtract cleanly'
  );

  // 5. Totals use integer paise with zero decimal drift
  const floatDriftCheck = estimateListCost(
    [
      { id: 'a', ingredientId: 'item_a', name: 'A', quantityText: '1 pcs', checked: false },
      { id: 'b', ingredientId: 'item_b', name: 'B', quantityText: '1 pcs', checked: false },
    ],
    samplePrices
  );
  console.assert(
    Number.isInteger(floatDriftCheck.totalPaise) && floatDriftCheck.totalPaise === 30,
    `Expected exact integer 30 paise, got ${floatDriftCheck.totalPaise}`
  );

  // 6. DEFAULT_PRICES covers every ingredient in INGREDIENTS
  for (const ing of INGREDIENTS) {
    const entry = DEFAULT_PRICES[ing.id];
    console.assert(
      entry && Number.isInteger(entry.perUnitPaise) && entry.perUnitPaise > 0 && typeof entry.unit === 'string' && entry.unit.length > 0,
      `DEFAULT_PRICES missing or invalid entry for ingredient "${ing.id}"`
    );
  }

  // 7. Indian grouping formatting & unknown "-" fallback
  console.assert(
    formatInr(12450000) === '₹ 1,24,500',
    `Expected Indian grouping "₹ 1,24,500", got "${formatInr(12450000)}"`
  );
  console.assert(formatInr(null) === '-' && formatInr(NaN) === '-', 'Unknown money must format as "-"');

  // 8. Weekly budget history groups Monday-start weeks over last 8 weeks
  const hist = aggregateWeeklyBudgetHistory(
    [
      { id: 'b1', date: '2026-11-16', totalPaise: 50000, itemCount: 5 }, // Mon
      { id: 'b2', date: '2026-11-18', totalPaise: 30000, itemCount: 3 }, // Wed same week
      { id: 'b3', date: '2026-11-09', totalPaise: 40000, itemCount: 4 }, // Prior Mon week
    ],
    '2026-11-19',
    8
  );
  console.assert(
    hist.weeks.length === 8 &&
      hist.weeks[7].weekStartIso === '2026-11-16' &&
      hist.weeks[7].totalPaise === 80000 &&
      hist.weeks[6].totalPaise === 40000 &&
      hist.weeklyAveragePaise === 60000 &&
      hist.highestWeek?.weekStartIso === '2026-11-16',
    `Unexpected budget history summary: ${JSON.stringify(hist)}`
  );
})();
