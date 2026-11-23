import { ChildEvaluation } from '../nutritionTargets';
import { CookedMeal, FestivalSelection, Household, RecipeMatch } from '../types/cook';

export interface RatingPreferenceEntry {
  score: number;
  avgRating: number;
  ratedCount: number;
  reason: string;
}

export interface RankedRecipeMatch extends RecipeMatch {
  childEval: ChildEvaluation;
  usesExpiringSoon: boolean;
  expiringIngredientIds: string[];
  ratingBoostScore: number;
  ratingBoostReason: string | null;
  seasonTag: string | null;
  festivalTag: string | null;
}

export function computeRatingPreferenceMap(
  cookedMeals: CookedMeal[]
): Record<string, RatingPreferenceEntry>;

export function rankCookMatches(params?: {
  matches?: RecipeMatch[];
  expiringIds?: string[];
  ratingPrefs?: Record<string, RatingPreferenceEntry>;
  hiddenRecipeIds?: string[];
  childFriendlyOnly?: boolean;
  household?: Household;
  festivalSelection?: FestivalSelection | null;
  now?: Date;
  preserveCustomSort?: boolean;
}): RankedRecipeMatch[];
