import { HouseholdMeta, WcicHouseholdsRegistry } from '../types/cook';

export const DEFAULT_HOUSEHOLD_ID: string;
export const DEFAULT_HOUSEHOLD_NAME: string;
export const HOUSEHOLDS_REGISTRY_KEY: string;
export const MIGRATION_BACKUP_KEY: string;
export const HOUSEHOLD_SCOPED_SPECS: Array<{
  field: string;
  legacyKey: string;
  suffix: string;
}>;

export function sanitizeHouseholdName(name: string): string;
export function sanitizeHouseholdId(raw: string): string;
export function householdStorageKey(householdId: string, suffix: string): string;

export function readRegistry(storage?: Storage | null): WcicHouseholdsRegistry;
export function writeRegistry(registry: WcicHouseholdsRegistry, storage?: Storage | null): boolean;
export function migrateLegacyStorageIfNeeded(storage?: Storage | null): WcicHouseholdsRegistry;
export function hasLegacyMigrationBackup(storage?: Storage | null): boolean;
export function clearLegacyMigrationBackup(storage?: Storage | null): void;

export function addHouseholdEntry(
  registry: WcicHouseholdsRegistry,
  name: string
): {
  ok: boolean;
  error: string | null;
  registry: WcicHouseholdsRegistry;
  created: HouseholdMeta | null;
};

export function renameHouseholdEntry(
  registry: WcicHouseholdsRegistry,
  householdId: string,
  nextName: string
): {
  ok: boolean;
  error: string | null;
  registry: WcicHouseholdsRegistry;
};

export function deleteHouseholdEntry(
  registry: WcicHouseholdsRegistry,
  householdId: string,
  storage?: Storage | null
): {
  ok: boolean;
  error: string | null;
  registry: WcicHouseholdsRegistry;
};
