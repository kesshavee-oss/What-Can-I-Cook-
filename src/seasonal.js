// Indian season detection and curated seasonal/festival recipe picks.
import { RECIPES } from './recipes.js';

export const SEASONS = {
  winter: { id: 'winter', label: 'Winter', monthsHint: 'Nov–Feb' },
  summer: { id: 'summer', label: 'Summer', monthsHint: 'Mar–Jun' },
  monsoon: { id: 'monsoon', label: 'Monsoon', monthsHint: 'Jul–Oct' },
};

export const FESTIVALS = [
  { id: 'diwali', label: 'Diwali' },
  { id: 'eid', label: 'Eid' },
  { id: 'pongal', label: 'Pongal' },
];

export const SEASONAL_RECIPE_IDS = {
  winter: [
    'palak_paneer',
    'aloo_gobi',
    'mutton_stew',
    'peanut_chikki',
    'rajma_chawal',
    'paratha',
    'dal_tadka',
    'paneer_tikka',
    'vegetable_khichdi',
    'egg_curry',
  ],
  summer: [
    'fruit_chaat',
    'corn_chaat',
    'sprouts_chaat',
    'lemon_rice',
    'idli',
    'poha',
    'vegetable_khichdi',
    'herb_seared_fish',
    'besan_chilla',
  ],
  monsoon: [
    'vegetable_cutlet',
    'chicken_keema_toasties',
    'crispy_chicken_bites',
    'besan_chilla',
    'upma',
    'masala_omelette',
    'egg_bhurji',
    'chole',
    'egg_pepper_fry',
    'dal_tadka',
  ],
};

export const FESTIVAL_RECIPE_IDS = {
  diwali: [
    'paneer_tikka',
    'peanut_chikki',
    'chole',
    'veg_pulao',
    'paneer_bhurji',
    'fruit_chaat',
    'crispy_chicken_bites',
  ],
  eid: [
    'chicken_biryani',
    'mutton_stew',
    'chicken_tikka',
    'chicken_curry',
    'chicken_keema_pav',
    'prawn_masala',
    'veg_pulao',
  ],
  pongal: [
    'lemon_rice',
    'vegetable_khichdi',
    'idli',
    'dosa',
    'egg_pepper_fry',
    'upma',
  ],
};

export const FESTIVAL_HIGHLIGHT_DAYS = 14;

/**
 * Determine the Indian culinary season from a local Date object or ISO date string.
 * Nov–Feb: winter, Mar–Jun: summer, Jul–Oct: monsoon.
 * @param {Date|string} [date]
 * @returns {{ id: "winter"|"summer"|"monsoon", label: string, monthsHint: string }}
 */
export function getIndianSeason(date = new Date()) {
  let d = date instanceof Date ? date : new Date();
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [y, m, day] = date.slice(0, 10).split('-').map(Number);
    d = new Date(y, m - 1, day);
  }
  const month = d.getMonth(); // 0 = Jan .. 11 = Dec
  if (month === 10 || month === 11 || month === 0 || month === 1) {
    return SEASONS.winter;
  }
  if (month >= 2 && month <= 5) {
    return SEASONS.summer;
  }
  return SEASONS.monsoon;
}

/**
 * Check whether a selected festival highlight is still active (within 14 days).
 * @param {{ id?: string, selectedAt?: string } | null} festivalSelection
 * @param {Date} [now]
 * @returns {{ active: boolean, id: string|null, label: string|null, daysLeft: number }}
 */
export function getActiveFestival(festivalSelection, now = new Date()) {
  if (!festivalSelection || !festivalSelection.id || !festivalSelection.selectedAt) {
    return { active: false, id: null, label: null, daysLeft: 0 };
  }
  const meta = FESTIVALS.find((f) => f.id === festivalSelection.id);
  if (!meta) return { active: false, id: null, label: null, daysLeft: 0 };

  const start = new Date(festivalSelection.selectedAt);
  if (Number.isNaN(start.getTime())) {
    return { active: false, id: null, label: null, daysLeft: 0 };
  }

  const diffDays = (now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
  if (diffDays < -1 || diffDays > FESTIVAL_HIGHLIGHT_DAYS) {
    return { active: false, id: null, label: null, daysLeft: 0 };
  }

  const daysLeft = Math.max(1, Math.ceil(FESTIVAL_HIGHLIGHT_DAYS - Math.max(0, diffDays)));
  return {
    active: true,
    id: meta.id,
    label: meta.label,
    daysLeft,
  };
}

/**
 * Return matching recipe IDs & badge labels for seasonal and optional active festival picks.
 * Never hides any recipe — strictly provides highlighting metadata.
 *
 * @param {Array<{ id: string }>} recipes
 * @param {{ id?: string, selectedAt?: string } | null} festivalSelection
 * @param {Date} [now]
 */
export function getSeasonalHighlights(recipes = [], festivalSelection = null, now = new Date()) {
  const season = getIndianSeason(now);
  const seasonSet = new Set(SEASONAL_RECIPE_IDS[season.id] || []);
  const festival = getActiveFestival(festivalSelection, now);
  const festivalSet = festival.active
    ? new Set(FESTIVAL_RECIPE_IDS[festival.id] || [])
    : new Set();

  const matchingSeasonal = [];
  const matchingFestival = [];

  for (const r of Array.isArray(recipes) ? recipes : []) {
    if (!r || !r.id) continue;
    if (festivalSet.has(r.id)) matchingFestival.push(r);
    if (seasonSet.has(r.id)) matchingSeasonal.push(r);
  }

  return {
    season,
    festival,
    seasonSet,
    festivalSet,
    matchingSeasonal,
    matchingFestival,
  };
}

// Self-tests
(function runSelfTests() {
  const knownIds = new Set(RECIPES.map((r) => r.id));

  for (const [seasonId, ids] of Object.entries(SEASONAL_RECIPE_IDS)) {
    for (const id of ids) {
      console.assert(
        knownIds.has(id),
        `Unknown recipe id "${id}" in SEASONAL_RECIPE_IDS.${seasonId}`
      );
    }
  }
  for (const [festId, ids] of Object.entries(FESTIVAL_RECIPE_IDS)) {
    for (const id of ids) {
      console.assert(
        knownIds.has(id),
        `Unknown recipe id "${id}" in FESTIVAL_RECIPE_IDS.${festId}`
      );
    }
  }

  console.assert(
    getIndianSeason(new Date(2026, 0, 15)).id === 'winter' &&
      getIndianSeason(new Date(2026, 4, 15)).id === 'summer' &&
      getIndianSeason(new Date(2026, 7, 15)).id === 'monsoon',
    'Indian season detection failed'
  );

  // Active festival lasts 14 days
  const active = getActiveFestival(
    { id: 'diwali', selectedAt: '2026-11-10T00:00:00.000Z' },
    new Date('2026-11-19T12:00:00.000Z')
  );
  console.assert(active.active === true && active.label === 'Diwali', 'Expected active Diwali festival within 14 days');

  const expired = getActiveFestival(
    { id: 'diwali', selectedAt: '2026-10-01T00:00:00.000Z' },
    new Date('2026-11-19T12:00:00.000Z')
  );
  console.assert(expired.active === false, 'Expected festival >14 days old to expire cleanly');
})();
