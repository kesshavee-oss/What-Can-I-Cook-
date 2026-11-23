// Multi-household registry & legacy single-household migration helpers (pure storage adapters).

export const DEFAULT_HOUSEHOLD_ID = 'home';
export const DEFAULT_HOUSEHOLD_NAME = 'Home';
export const HOUSEHOLDS_REGISTRY_KEY = 'wcic_households';
export const MIGRATION_BACKUP_KEY = 'wcic_migration_backup_v1';

// Mapping between legacy/export flat key suffix and per-household storage suffix
export const HOUSEHOLD_SCOPED_SPECS = [
  { field: 'household', legacyKey: 'wcc_household_v1', suffix: 'household' },
  { field: 'defaultDiet', legacyKey: 'wcc_default_diet_v1', suffix: 'default_diet' },
  { field: 'allergies', legacyKey: 'wcc_allergies_v1', suffix: 'allergies' },
  { field: 'favoriteRecipeIds', legacyKey: 'wcc_favorite_recipe_ids_v1', suffix: 'favorite_recipe_ids' },
  { field: 'cookedMeals', legacyKey: 'wcc_cooked_meals_v1', suffix: 'cooked_meals' },
  { field: 'cookSelection', legacyKey: 'wcc_cook_selection_v1', suffix: 'cook_selection' },
  { field: 'groceryList', legacyKey: 'wcc_grocery_list_v1', suffix: 'grocery_list' },
  { field: 'plannedMeals', legacyKey: 'wcc_planned_meals_v1', suffix: 'planned_meals' },
  { field: 'wcic_ai_recipes', legacyKey: 'wcic_ai_recipes', suffix: 'ai_recipes' },
  { field: 'wcic_prices', legacyKey: 'wcic_prices', suffix: 'prices' },
  { field: 'wcic_settings', legacyKey: 'wcic_settings', suffix: 'settings' },
  { field: 'wcic_leftovers', legacyKey: 'wcic_leftovers', suffix: 'leftovers' },
  { field: 'wcic_pantry', legacyKey: 'wcic_pantry', suffix: 'pantry' },
  { field: 'wcic_purchases', legacyKey: 'wcic_purchases', suffix: 'purchases' },
];

export function sanitizeHouseholdName(name) {
  const cleaned = String(name ?? '').trim().replace(/\s+/g, ' ');
  return cleaned.slice(0, 40);
}

export function sanitizeHouseholdId(raw) {
  const slug = String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return slug || `hh_${Date.now().toString(36)}`;
}

export function householdStorageKey(householdId, suffix) {
  const safeId = householdId && typeof householdId === 'string' ? householdId.trim() : DEFAULT_HOUSEHOLD_ID;
  return `wcic_hh_${safeId}_${suffix}`;
}

function getBrowserStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readRegistry(storage = getBrowserStorage()) {
  const fallback = {
    activeId: DEFAULT_HOUSEHOLD_ID,
    households: [{ id: DEFAULT_HOUSEHOLD_ID, name: DEFAULT_HOUSEHOLD_NAME }],
  };
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(HOUSEHOLDS_REGISTRY_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.households)) {
      return fallback;
    }
    const cleanList = [];
    const seen = new Set();
    for (const h of parsed.households) {
      if (!h || typeof h !== 'object') continue;
      const id = typeof h.id === 'string' && h.id.trim() ? h.id.trim() : '';
      const name = sanitizeHouseholdName(h.name);
      if (!id || !name || seen.has(id)) continue;
      seen.add(id);
      cleanList.push({ id, name });
    }
    if (cleanList.length === 0) return fallback;
    const activeId = seen.has(parsed.activeId) ? parsed.activeId : cleanList[0].id;
    return { activeId, households: cleanList };
  } catch {
    return fallback;
  }
}

export function writeRegistry(registry, storage = getBrowserStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(HOUSEHOLDS_REGISTRY_KEY, JSON.stringify(registry));
    return true;
  } catch {
    return false;
  }
}

/**
 * Migrate legacy flat keys (wcc_* / wcic_*) into the default "Home" household bucket
 * on first run, while keeping wcic_migration_backup_v1 until user confirms removal.
 */
export function migrateLegacyStorageIfNeeded(storage = getBrowserStorage()) {
  if (!storage) return readRegistry(null);
  try {
    const existingRegRaw = storage.getItem(HOUSEHOLDS_REGISTRY_KEY);
    if (existingRegRaw) {
      return readRegistry(storage);
    }

    const legacySnapshot = {};
    let foundAnyLegacy = false;

    for (const spec of HOUSEHOLD_SCOPED_SPECS) {
      try {
        const val = storage.getItem(spec.legacyKey);
        if (val !== null) {
          foundAnyLegacy = true;
          legacySnapshot[spec.legacyKey] = val;
          const scopedKey = householdStorageKey(DEFAULT_HOUSEHOLD_ID, spec.suffix);
          if (storage.getItem(scopedKey) === null) {
            storage.setItem(scopedKey, val);
          }
        }
      } catch {
        // Ignore single-key failure cleanly
      }
    }

    if (foundAnyLegacy) {
      try {
        storage.setItem(
          MIGRATION_BACKUP_KEY,
          JSON.stringify({
            migratedAt: new Date().toISOString(),
            targetHouseholdId: DEFAULT_HOUSEHOLD_ID,
            legacyKeys: legacySnapshot,
          })
        );
      } catch {
        // Non-fatal if quota full
      }
    }

    const initialRegistry = {
      activeId: DEFAULT_HOUSEHOLD_ID,
      households: [{ id: DEFAULT_HOUSEHOLD_ID, name: DEFAULT_HOUSEHOLD_NAME }],
    };
    writeRegistry(initialRegistry, storage);
    return initialRegistry;
  } catch {
    return readRegistry(storage);
  }
}

export function hasLegacyMigrationBackup(storage = getBrowserStorage()) {
  if (!storage) return false;
  try {
    return storage.getItem(MIGRATION_BACKUP_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearLegacyMigrationBackup(storage = getBrowserStorage()) {
  if (!storage) return;
  try {
    storage.removeItem(MIGRATION_BACKUP_KEY);
  } catch {
    // ignore
  }
}

export function addHouseholdEntry(registry, name) {
  const cleanName = sanitizeHouseholdName(name);
  if (!cleanName) {
    return { ok: false, error: 'Enter a household name.', registry, created: null };
  }
  const safeReg = registry && Array.isArray(registry.households)
    ? registry
    : { activeId: DEFAULT_HOUSEHOLD_ID, households: [{ id: DEFAULT_HOUSEHOLD_ID, name: DEFAULT_HOUSEHOLD_NAME }] };

  if (safeReg.households.length >= 10) {
    return { ok: false, error: 'You can keep up to 10 households.', registry: safeReg, created: null };
  }

  let baseId = sanitizeHouseholdId(cleanName);
  const existingIds = new Set(safeReg.households.map((h) => h.id));
  let id = baseId;
  let counter = 2;
  while (existingIds.has(id)) {
    id = `${baseId}_${counter}`;
    counter += 1;
  }

  const created = { id, name: cleanName };
  const nextReg = {
    activeId: id,
    households: [...safeReg.households, created],
  };
  return { ok: true, error: null, registry: nextReg, created };
}

export function renameHouseholdEntry(registry, householdId, nextName) {
  const cleanName = sanitizeHouseholdName(nextName);
  if (!cleanName) {
    return { ok: false, error: 'Enter a valid household name.', registry };
  }
  const safeReg = registry || readRegistry(null);
  const exists = safeReg.households.some((h) => h.id === householdId);
  if (!exists) {
    return { ok: false, error: 'Household not found.', registry: safeReg };
  }
  return {
    ok: true,
    error: null,
    registry: {
      ...safeReg,
      households: safeReg.households.map((h) =>
        h.id === householdId ? { ...h, name: cleanName } : h
      ),
    },
  };
}

export function deleteHouseholdEntry(registry, householdId, storage = getBrowserStorage()) {
  const safeReg = registry || readRegistry(null);
  if (safeReg.households.length <= 1) {
    return { ok: false, error: 'Keep at least one household.', registry: safeReg };
  }
  const remaining = safeReg.households.filter((h) => h.id !== householdId);
  if (remaining.length === safeReg.households.length) {
    return { ok: false, error: 'Household not found.', registry: safeReg };
  }

  if (storage) {
    for (const spec of HOUSEHOLD_SCOPED_SPECS) {
      try {
        storage.removeItem(householdStorageKey(householdId, spec.suffix));
      } catch {
        // ignore
      }
    }
  }

  const nextActiveId =
    safeReg.activeId === householdId ? remaining[0].id : safeReg.activeId;
  const nextReg = { activeId: nextActiveId, households: remaining };
  writeRegistry(nextReg, storage);
  return { ok: true, error: null, registry: nextReg };
}

// Self-tests
(function runSelfTests() {
  const map = new Map();
  const mockStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };

  mockStorage.setItem('wcc_household_v1', JSON.stringify({ adults: 3, children: [] }));
  mockStorage.setItem('wcc_default_diet_v1', JSON.stringify('nonveg'));

  const reg1 = migrateLegacyStorageIfNeeded(mockStorage);
  console.assert(
    reg1.activeId === 'home' &&
      reg1.households.length === 1 &&
      reg1.households[0].name === 'Home',
    'Migration should initialize Home household'
  );
  console.assert(
    mockStorage.getItem('wcic_hh_home_household') === JSON.stringify({ adults: 3, children: [] }) &&
      hasLegacyMigrationBackup(mockStorage),
    'Migration must copy legacy data to wcic_hh_home_* and create backup'
  );

  const added = addHouseholdEntry(reg1, 'Parents Kitchen');
  console.assert(
    added.ok && added.registry.households.length === 2 && added.registry.activeId === added.created.id,
    'addHouseholdEntry should create and activate second household'
  );

  const renamed = renameHouseholdEntry(added.registry, added.created.id, 'Mom Kitchen');
  console.assert(
    renamed.ok && renamed.registry.households[1].name === 'Mom Kitchen',
    'renameHouseholdEntry failed'
  );

  const blockedDeleteSingle = deleteHouseholdEntry(reg1, 'home', mockStorage);
  console.assert(blockedDeleteSingle.ok === false, 'Should not delete the last remaining household');

  const deleted = deleteHouseholdEntry(renamed.registry, added.created.id, mockStorage);
  console.assert(
    deleted.ok && deleted.registry.households.length === 1 && deleted.registry.activeId === 'home',
    'deleteHouseholdEntry should fall back to remaining household'
  );
})();
