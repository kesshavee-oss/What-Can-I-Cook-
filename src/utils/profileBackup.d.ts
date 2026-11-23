import {
  AllergyKey,
  CookedMeal,
  DietType,
  GroceryItem,
  Household,
  LeftoverItem,
  PantryEntry,
  PlannedMeal,
  PriceMap,
  PurchaseRecord,
  Recipe,
  WcicHouseholdsRegistry,
  WcicSettings,
} from '../types/cook';

export interface BackupData {
  household: Household;
  defaultDiet: DietType;
  allergies: AllergyKey[];
  favoriteRecipeIds: string[];
  cookedMeals: CookedMeal[];
  groceryList?: GroceryItem[];
  plannedMeals?: PlannedMeal[];
  wcic_ai_recipes?: Recipe[];
  wcic_prices?: PriceMap;
  wcic_settings?: WcicSettings;
  wcic_leftovers?: LeftoverItem[];
  wcic_pantry?: PantryEntry[];
  wcic_purchases?: PurchaseRecord[];
}

export interface BackupPayload extends Required<BackupData> {
  app: string;
  version: number;
  exportedAt: string;
  wcic_households?: WcicHouseholdsRegistry;
  householdBundles?: Record<string, Required<BackupData>>;
}

export const BACKUP_FORMAT_VERSION: number;

export function createBackupPayload(state: BackupData): BackupPayload;

export function createAllHouseholdsBackupPayload(params: {
  registry: WcicHouseholdsRegistry;
  activeState: BackupData;
  bundlesById: Record<string, BackupData>;
}): BackupPayload;

export function validateBackupData(
  raw: unknown
):
  | {
      ok: true;
      data: Required<BackupData> & {
        wcic_households?: WcicHouseholdsRegistry;
        householdBundles?: Record<string, Required<BackupData>>;
      };
    }
  | { ok: false; error: string };
