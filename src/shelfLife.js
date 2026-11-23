// Per-ingredient typical home shelf-life (in days) & freshness expiry helpers.
// Items not present in SHELF_LIFE_DAYS (spices, dried pulses, grains, oils) never expire.
import { getIngredientById } from './recipes.js';

export const SHELF_LIFE_DAYS = {
  // Fresh leafy & quick-spoiling vegetables
  spinach: 3,
  fenugreek_leaves: 3,
  coriander_leaves: 4,
  mint_leaves: 4,
  curry_leaves: 5,
  mushroom: 4,
  okra: 4,
  french_beans: 5,
  broccoli: 5,
  green_peas: 5,
  tomato: 6,
  cucumber: 6,
  bell_pepper: 6,
  cauliflower: 7,
  cabbage: 7,
  brinjal: 6,
  bottle_gourd: 7,
  radish: 7,
  sweet_corn: 4,
  green_chilli: 7,
  carrot: 10,
  beetroot: 14,
  lemon: 14,
  ginger: 14,
  potato: 21,
  onion: 21,
  garlic: 30,

  // Fresh fruits
  banana: 4,
  watermelon: 4,
  papaya: 4,
  grapes: 5,
  guava: 5,
  mango: 5,
  pineapple: 5,
  kiwi: 7,
  pear: 7,
  orange: 10,
  pomegranate: 14,
  apple: 14,
  fresh_coconut: 5,

  // Fresh meat & fish (refrigerated)
  chicken_curry_cut: 2,
  chicken_breast: 2,
  chicken_keema: 2,
  fish_fillet: 2,
  prawns: 2,
  mutton: 2,
  chicken_wings: 2,
  chicken_drumsticks: 2,
  chicken_liver: 2,
  turkey_mince: 2,
  duck_meat: 2,
  rohu_fish: 2,
  pomfret: 2,
  salmon: 2,
  tuna: 2,
  crab: 2,
  lamb_chops: 2,

  // Eggs & dairy
  milk: 3,
  buttermilk: 3,
  hung_curd: 4,
  paneer: 5,
  fresh_cream: 5,
  yogurt: 6,
  khoya: 5,
  cream_cheese: 10,
  mozzarella: 10,
  egg: 14,
  cheese: 21,
  butter: 30,

  // Fresh bakery & batters / sprouts
  bread: 5,
  pav: 4,
  idli_batter: 5,
  moong_sprouts: 3,
  roti_wrap: 5,
  ginger_garlic_paste: 14,
};

function parseIsoDay(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

function formatIsoDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return shelf-life days for an ingredient, or null if it has no expiry rule.
 * @param {string} ingredientId
 * @returns {number|null}
 */
export function getShelfLifeDays(ingredientId) {
  if (typeof ingredientId !== 'string') return null;
  const days = SHELF_LIFE_DAYS[ingredientId];
  return typeof days === 'number' && days > 0 ? days : null;
}

/**
 * Compute expiry ISO date from boughtOn + shelf-life days, or null if non-perishable or invalid date.
 * @param {string} ingredientId
 * @param {string} boughtOnIso
 * @returns {string|null}
 */
export function computeIngredientExpiryDate(ingredientId, boughtOnIso) {
  const lifeDays = getShelfLifeDays(ingredientId);
  if (lifeDays === null) return null;
  const boughtDate = parseIsoDay(boughtOnIso);
  if (!boughtDate) return null;
  const exp = new Date(boughtDate.getFullYear(), boughtDate.getMonth(), boughtDate.getDate() + lifeDays);
  return formatIsoDay(exp);
}

/**
 * Compute days remaining until expiry relative to `todayIso`.
 * Returns null if the ingredient has no shelf-life rule or no valid `boughtOnIso`.
 *
 * @param {string} ingredientId
 * @param {string} boughtOnIso
 * @param {string} [todayIso]
 * @returns {number|null}
 */
export function getDaysRemaining(ingredientId, boughtOnIso, todayIso) {
  const expiryIso = computeIngredientExpiryDate(ingredientId, boughtOnIso);
  if (!expiryIso) return null;
  const expDate = parseIsoDay(expiryIso);
  const refDate = todayIso ? parseIsoDay(todayIso) : new Date();
  if (!expDate || !refDate) return null;
  const todayMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  return Math.round((expDate.getTime() - todayMidnight.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Build a human-friendly freshness label from daysRemaining.
 * Never uses harsh alarmist phrasing.
 * @param {number|null} daysRemaining
 * @returns {string}
 */
export function formatFreshnessLabel(daysRemaining) {
  if (typeof daysRemaining !== 'number' || Number.isNaN(daysRemaining)) return '-';
  if (daysRemaining < 0) return 'Check before using';
  if (daysRemaining === 0) return 'Use today';
  if (daysRemaining === 1) return '1 day left';
  return `${daysRemaining} days left`;
}

/**
 * Collect selected pantry items expiring within `withinDays` (default 2 days),
 * sorted soonest-first.
 *
 * @param {Array<{ ingredientId: string, boughtOn: string }>} pantryEntries
 * @param {string[]} selectedIds
 * @param {number} [withinDays=2]
 * @param {string} [todayIso]
 * @returns {Array<{ ingredientId: string, name: string, boughtOn: string, expiryDate: string, daysRemaining: number, label: string }>}
 */
export function getExpiringSoonItems(
  pantryEntries = [],
  selectedIds = [],
  withinDays = 2,
  todayIso
) {
  const entries = Array.isArray(pantryEntries) ? pantryEntries : [];
  const selectedSet = new Set(Array.isArray(selectedIds) ? selectedIds : []);
  const results = [];

  for (const entry of entries) {
    if (!entry || !selectedSet.has(entry.ingredientId)) continue;
    const daysRemaining = getDaysRemaining(entry.ingredientId, entry.boughtOn, todayIso);
    if (daysRemaining === null || daysRemaining > withinDays) continue;
    const expiryDate = computeIngredientExpiryDate(entry.ingredientId, entry.boughtOn);
    const catalog = getIngredientById(entry.ingredientId);
    results.push({
      ingredientId: entry.ingredientId,
      name: catalog?.name ?? entry.ingredientId,
      boughtOn: entry.boughtOn,
      expiryDate,
      daysRemaining,
      label: formatFreshnessLabel(daysRemaining),
    });
  }

  results.sort((a, b) => a.daysRemaining - b.daysRemaining || a.name.localeCompare(b.name));
  return results;
}

// Self-tests
(function runSelfTests() {
  // Items with no shelf-life value never expire
  console.assert(
    getShelfLifeDays('rice') === null &&
      getShelfLifeDays('salt') === null &&
      getDaysRemaining('rice', '2026-11-01', '2026-11-19') === null,
    'Non-perishable pantry items like rice and salt must never expire'
  );

  // Perishable math: spinach shelf life = 3 days
  console.assert(
    computeIngredientExpiryDate('spinach', '2026-11-16') === '2026-11-19' &&
      getDaysRemaining('spinach', '2026-11-16', '2026-11-18') === 1 &&
      getDaysRemaining('spinach', '2026-11-16', '2026-11-19') === 0,
    'Shelf-life date math mismatch for spinach'
  );

  // Within 2 days filter & sort
  const soon = getExpiringSoonItems(
    [
      { ingredientId: 'spinach', boughtOn: '2026-11-17' }, // expires 2026-11-20 -> 1 day left
      { ingredientId: 'potato', boughtOn: '2026-11-18' }, // expires in 20 days -> excluded
      { ingredientId: 'chicken_breast', boughtOn: '2026-11-17' }, // expires 2026-11-19 -> 0 days left
      { ingredientId: 'rice', boughtOn: '2026-11-01' }, // never expires -> excluded
    ],
    ['spinach', 'potato', 'chicken_breast', 'rice'],
    2,
    '2026-11-19'
  );
  console.assert(
    soon.length === 2 &&
      soon[0].ingredientId === 'chicken_breast' &&
      soon[1].ingredientId === 'spinach',
    `Expected [chicken_breast, spinach] sorted soonest-first, got ${JSON.stringify(soon)}`
  );

  // Unselected items are not included
  const onlySelected = getExpiringSoonItems(
    [{ ingredientId: 'milk', boughtOn: '2026-11-17' }],
    ['onion'],
    2,
    '2026-11-19'
  );
  console.assert(
    onlySelected.length === 0,
    'Unselected ingredients must not appear in expiring-soon strip'
  );
})();
