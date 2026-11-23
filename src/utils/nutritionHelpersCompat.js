// Minimal helper to avoid circular runtime dependency inside nutritionTargets.js.
import { RECIPES } from '../recipes.js';

const BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

export function getRecipeByIdSafe(id) {
  return BY_ID.get(id) ?? null;
}
