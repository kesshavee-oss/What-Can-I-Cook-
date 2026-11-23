// Pure leftover management helpers for "What Can I Cook?".

function makeLeftoverId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `lo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Add whole calendar days to a YYYY-MM-DD date string safely.
 * @param {string} dateIso
 * @param {number} days
 * @returns {string}
 */
export function addDaysToIso(dateIso, days) {
  if (typeof dateIso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + (Number(days) || 0));
    const y = fallback.getFullYear();
    const m = String(fallback.getMonth() + 1).padStart(2, '0');
    const d = String(fallback.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + (Number(days) || 0));
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

/**
 * Build a validated LeftoverItem record, returning null if portions <= 0.
 */
export function createLeftoverRecord({
  id,
  recipeId,
  portions,
  maxServings = 20,
  cookedDate,
  keepUntil,
}) {
  const cleanPortions = Math.min(
    Math.max(0, Math.round(Number(portions) || 0)),
    Math.max(1, Math.round(Number(maxServings) || 20))
  );
  if (!recipeId || cleanPortions <= 0) return null;

  const safeCooked =
    typeof cookedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cookedDate)
      ? cookedDate
      : addDaysToIso('', 0);
  const safeKeepUntil =
    typeof keepUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(keepUntil)
      ? keepUntil
      : addDaysToIso(safeCooked, 2);

  return {
    id: typeof id === 'string' && id.trim() ? id.trim() : makeLeftoverId(),
    recipeId: String(recipeId).trim(),
    portions: cleanPortions,
    cookedDate: safeCooked,
    keepUntil: safeKeepUntil,
    usedUp: false,
  };
}

/**
 * Decrement portions by 1 (clamped >= 0) and mark usedUp when hitting 0.
 */
export function eatLeftoverPortion(list, leftoverId) {
  return (Array.isArray(list) ? list : []).map((item) => {
    if (!item || item.id !== leftoverId) return item;
    const nextPortions = Math.max(0, (Math.round(Number(item.portions) || 0)) - 1);
    return {
      ...item,
      portions: nextPortions,
      usedUp: nextPortions <= 0,
    };
  });
}

/**
 * Mark a leftover entry as used up immediately.
 */
export function markLeftoverUsedUp(list, leftoverId) {
  return (Array.isArray(list) ? list : []).map((item) =>
    item && item.id === leftoverId
      ? { ...item, portions: 0, usedUp: true }
      : item
  );
}

/**
 * Return active leftovers sorted with items expiring within 1 day (or past keepUntil) first.
 * @param {Array<object>} list
 * @param {string} todayIso
 */
export function sortActiveLeftovers(list, todayIso = addDaysToIso('', 0)) {
  const safeToday =
    typeof todayIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(todayIso)
      ? todayIso
      : addDaysToIso('', 0);
  const tomorrowIso = addDaysToIso(safeToday, 1);

  return (Array.isArray(list) ? list : [])
    .filter((item) => item && !item.usedUp && Number(item.portions) > 0)
    .map((item) => {
      const keepUntil =
        typeof item.keepUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.keepUntil)
          ? item.keepUntil
          : addDaysToIso(item.cookedDate || safeToday, 2);
      const isPastKeepUntil = safeToday > keepUntil;
      const isExpiringWithinOneDay = keepUntil <= tomorrowIso;
      return {
        ...item,
        keepUntil,
        isPastKeepUntil,
        isExpiringWithinOneDay,
      };
    })
    .sort((a, b) => {
      if (a.isExpiringWithinOneDay !== b.isExpiringWithinOneDay) {
        return a.isExpiringWithinOneDay ? -1 : 1;
      }
      return String(a.keepUntil).localeCompare(String(b.keepUntil));
    });
}

// Self-tests
(function runSelfTests() {
  console.assert(
    addDaysToIso('2026-11-29', 2) === '2026-12-01',
    'addDaysToIso month rollover failed'
  );

  const zero = createLeftoverRecord({ recipeId: 'poha', portions: 0, cookedDate: '2026-11-19' });
  console.assert(zero === null, '0 leftover portions should not create record');

  const rec = createLeftoverRecord({
    id: 'lo1',
    recipeId: 'dal_tadka',
    portions: 2,
    cookedDate: '2026-11-18',
  });
  console.assert(
    rec && rec.keepUntil === '2026-11-20' && rec.portions === 2 && rec.usedUp === false,
    'Default leftover keepUntil should be +2 days'
  );

  const afterEat1 = eatLeftoverPortion([rec], 'lo1');
  console.assert(
    afterEat1[0].portions === 1 && afterEat1[0].usedUp === false,
    'Eating 1 of 2 portions should leave 1'
  );
  const afterEat2 = eatLeftoverPortion(afterEat1, 'lo1');
  console.assert(
    afterEat2[0].portions === 0 && afterEat2[0].usedUp === true,
    'Eating last portion should set portions=0 and usedUp=true'
  );

  const sorted = sortActiveLeftovers(
    [
      { id: 'fresh', recipeId: 'poha', portions: 2, cookedDate: '2026-11-19', keepUntil: '2026-11-23', usedUp: false },
      { id: 'soon', recipeId: 'chole', portions: 1, cookedDate: '2026-11-18', keepUntil: '2026-11-20', usedUp: false },
      { id: 'old', recipeId: 'idli', portions: 1, cookedDate: '2026-11-15', keepUntil: '2026-11-17', usedUp: false },
      { id: 'done', recipeId: 'upma', portions: 0, cookedDate: '2026-11-19', keepUntil: '2026-11-21', usedUp: true },
    ],
    '2026-11-19'
  );
  console.assert(
    sorted.length === 3 &&
      sorted[0].id === 'old' &&
      sorted[0].isPastKeepUntil === true &&
      sorted[1].id === 'soon' &&
      sorted[1].isExpiringWithinOneDay === true &&
      sorted[2].id === 'fresh' &&
      sorted[2].isExpiringWithinOneDay === false,
    `Unexpected leftover sorting: ${JSON.stringify(sorted)}`
  );
})();
