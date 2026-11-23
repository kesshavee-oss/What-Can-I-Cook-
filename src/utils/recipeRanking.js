// Pure ranking, seasonal highlighting, child nutrition evaluation, and rating preference helpers.
import { compareRecipeMatches } from '../recipes.js';
import { evaluateRecipeForChildren } from '../nutritionTargets.js';
import { getSeasonalHighlights } from '../seasonal.js';

/**
 * Compute bounded rating preference scores per recipe from cooked meal ratings (1-5 stars).
 * Neutral 3 stars = 0; capped in [-6, 6] so it only breaks ties inside the same matchScore tier.
 * @param {Array<object>} cookedMeals
 * @returns {Record<string, { score: number, avgRating: number, ratedCount: number, reason: string }>}
 */
export function computeRatingPreferenceMap(cookedMeals) {
  const byRecipe = new Map();
  for (const meal of Array.isArray(cookedMeals) ? cookedMeals : []) {
    if (!meal || typeof meal.recipeId !== 'string') continue;
    const rating = Number(meal.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue;
    const prev = byRecipe.get(meal.recipeId) || { sum: 0, count: 0 };
    prev.sum += rating;
    prev.count += 1;
    byRecipe.set(meal.recipeId, prev);
  }

  const out = {};
  for (const [recipeId, stats] of byRecipe.entries()) {
    const avg = Math.round((stats.sum / stats.count) * 10) / 10;
    const weight = Math.min(stats.count, 3);
    const rawScore = (avg - 3) * weight;
    const score = Math.max(-6, Math.min(6, Math.round(rawScore * 10) / 10));
    const starsLabel = Number.isInteger(avg) ? `${avg}` : `${avg.toFixed(1)}`;
    const reason =
      stats.count === 1
        ? `You rated this ${starsLabel} stars.`
        : `You rated this ${starsLabel} stars across ${stats.count} cooks.`;
    out[recipeId] = {
      score,
      avgRating: avg,
      ratedCount: stats.count,
      reason,
    };
  }
  return out;
}

/**
 * Apply hidden recipes filter, child-friendly filter, expiring-soon lift, seasonal/festival tags,
 * and rating tie-breaker inside equal matchScore tiers without ever crossing the 50% threshold
 * or altering any recipe's matchScore.
 */
export function rankCookMatches({
  matches = [],
  expiringIds = [],
  ratingPrefs = {},
  hiddenRecipeIds = [],
  childFriendlyOnly = false,
  household = { adults: 2, children: [] },
  festivalSelection = null,
  now = new Date(),
  preserveCustomSort = false,
} = {}) {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const hiddenSet = new Set(Array.isArray(hiddenRecipeIds) ? hiddenRecipeIds : []);
  const expiringSet = new Set(Array.isArray(expiringIds) ? expiringIds : []);
  const hasChildren = Array.isArray(household?.children) && household.children.length > 0;

  const enriched = [];

  for (const recipe of safeMatches) {
    if (!recipe || typeof recipe !== 'object') continue;
    if (hiddenSet.has(recipe.id)) continue;

    const childEval = evaluateRecipeForChildren(recipe, household);
    if (childFriendlyOnly && hasChildren && !childEval.isChildFriendly) {
      continue;
    }

    const recipeExpIds = [];
    if (expiringSet.size > 0 && Array.isArray(recipe.ingredients)) {
      for (const ing of recipe.ingredients) {
        if (ing?.ingredientId && expiringSet.has(ing.ingredientId)) {
          recipeExpIds.push(ing.ingredientId);
        }
      }
    }
    const usesExpiringSoon = recipeExpIds.length > 0;

    const pref = ratingPrefs && typeof ratingPrefs === 'object' ? ratingPrefs[recipe.id] : null;
    const ratingBoostScore = pref && typeof pref.score === 'number' ? pref.score : 0;
    const ratingBoostReason = ratingBoostScore > 0 && pref?.reason ? pref.reason : null;

    const highlights = getSeasonalHighlights([recipe], festivalSelection, now);
    const seasonMatch = highlights.seasonSet.has(recipe.id);
    const festivalMatch = highlights.festivalSet.has(recipe.id);

    enriched.push({
      ...recipe,
      usesExpiringSoon,
      expiringIngredientIds: recipeExpIds,
      ratingBoostScore,
      ratingBoostReason,
      childEval,
      seasonTag: seasonMatch ? highlights.season.label : null,
      festivalTag: festivalMatch && highlights.festival?.label ? highlights.festival.label : null,
    });
  }

  if (preserveCustomSort) {
    return enriched;
  }

  return enriched.sort((a, b) => {
    const closestA = Boolean(a.isClosestMatch || (Number(a.matchScore) || 0) < 50);
    const closestB = Boolean(b.isClosestMatch || (Number(b.matchScore) || 0) < 50);
    if (closestA !== closestB) return closestA ? 1 : -1;

    if (Boolean(a.usesExpiringSoon) !== Boolean(b.usesExpiringSoon)) {
      return a.usesExpiringSoon ? -1 : 1;
    }

    const scoreA = Number(a.matchScore) || 0;
    const scoreB = Number(b.matchScore) || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    // Rating preference applies ONLY inside the exact same matchScore tier
    const boostA = Number(a.ratingBoostScore) || 0;
    const boostB = Number(b.ratingBoostScore) || 0;
    if (boostB !== boostA) return boostB - boostA;

    return compareRecipeMatches(a, b);
  });
}

// Self-tests
(function runSelfTests() {
  const prefs = computeRatingPreferenceMap([
    { recipeId: 'r_high', rating: 5 },
    { recipeId: 'r_high', rating: 5 },
    { recipeId: 'r_low', rating: 1 },
    { recipeId: 'r_neutral', rating: 3 },
  ]);
  console.assert(
    prefs.r_high.score === 4 && prefs.r_low.score === -2 && prefs.r_neutral.score === 0,
    `Unexpected rating preference scores: ${JSON.stringify(prefs)}`
  );

  // Rating preference breaks ties inside the same matchScore tier, NEVER across tiers or 50%
  const syntheticMatches = [
    {
      id: 'tier_80_low_rating',
      name: 'High match low rating',
      matchScore: 80,
      coverage: 0.8,
      missingRequiredCount: 1,
      usedSelectedCount: 3,
      prepMinutes: 10,
      cookMinutes: 15,
      ingredients: [{ ingredientId: 'onion', amount: 1, unit: 'pcs', optional: false }],
      nutritionPerServing: { calcium: 150, iron: 4 },
    },
    {
      id: 'tier_70_five_star',
      name: 'Lower match 5-star',
      matchScore: 70,
      coverage: 0.7,
      missingRequiredCount: 1,
      usedSelectedCount: 2,
      prepMinutes: 10,
      cookMinutes: 10,
      ingredients: [{ ingredientId: 'tomato', amount: 1, unit: 'pcs', optional: false }],
      nutritionPerServing: { calcium: 150, iron: 4 },
    },
    {
      id: 'tier_70_unrated',
      name: 'Same tier 70 unrated',
      matchScore: 70,
      coverage: 0.7,
      missingRequiredCount: 1,
      usedSelectedCount: 2,
      prepMinutes: 5,
      cookMinutes: 5,
      ingredients: [{ ingredientId: 'tomato', amount: 1, unit: 'pcs', optional: false }],
      nutritionPerServing: { calcium: 150, iron: 4 },
    },
    {
      id: 'hidden_dish',
      name: 'Hidden',
      matchScore: 100,
      coverage: 1,
      missingRequiredCount: 0,
      usedSelectedCount: 4,
      prepMinutes: 5,
      cookMinutes: 5,
      ingredients: [],
      nutritionPerServing: { calcium: 150, iron: 4 },
    },
    {
      id: 'below_50_expiring',
      name: 'Closest below 50 with expiring',
      matchScore: 40,
      isClosestMatch: true,
      coverage: 0.4,
      missingRequiredCount: 2,
      usedSelectedCount: 1,
      prepMinutes: 10,
      cookMinutes: 10,
      ingredients: [{ ingredientId: 'spinach', amount: 1, unit: 'bunch', optional: false }],
      nutritionPerServing: { calcium: 150, iron: 4 },
    },
  ];

  const ranked = rankCookMatches({
    matches: syntheticMatches,
    ratingPrefs: {
      tier_80_low_rating: { score: -2, avgRating: 1, ratedCount: 1, reason: '' },
      tier_70_five_star: { score: 6, avgRating: 5, ratedCount: 3, reason: 'You rated this 5 stars across 3 cooks.' },
    },
    hiddenRecipeIds: ['hidden_dish'],
    expiringIds: ['spinach'],
  });

  const ids = ranked.map((r) => r.id);
  console.assert(!ids.includes('hidden_dish'), 'Hidden recipe must be excluded');
  console.assert(
    ids[0] === 'tier_80_low_rating' && ids[1] === 'tier_70_five_star' && ids[2] === 'tier_70_unrated',
    `Rating boost should break ties within 70% tier only without beating 80%: got ${ids.join(',')}`
  );
  console.assert(
    ids[3] === 'below_50_expiring' && ranked[3].matchScore === 40 && ranked[3].usesExpiringSoon === true,
    'Expiring item in <50% tier must not cross above >=50% tier and must preserve matchScore'
  );
})();
