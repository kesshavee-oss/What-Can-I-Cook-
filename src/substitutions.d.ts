import { AllergyKey, DietType, Household } from './types/cook';

export interface SubstitutionEntry {
  ingredientId: string;
  note: string;
  ratioText: string;
}

export interface SubstitutionOption extends SubstitutionEntry {
  name: string;
}

export interface SubstitutionFilters {
  diet?: DietType;
  recipeDiet?: DietType;
  allergies?: AllergyKey[];
}

export const SUBSTITUTIONS: Record<string, SubstitutionEntry[]>;

export function getTotalSubstitutionCount(): number;

export function getSubstitutesFor(
  ingredientId: string,
  household: Household | null,
  selectedIds: string[],
  filters?: SubstitutionFilters
): SubstitutionOption[];
