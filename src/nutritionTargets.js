// General adult & child nutrition reference targets and daily/child-friendly helpers.
import { getRecipeByIdSafe } from './utils/nutritionHelpersCompat.js';

export const ADULT_NUTRITION_TARGETS = {
  protein: 50, // g
  calcium: 1000, // mg
  iron: 18, // mg (female reference)
  ironFemale: 18, // mg
  ironMale: 8, // mg
  fiber: 25, // g
};

/**
 * General child reference guidance by age group (Protein g, Calcium mg, Iron mg).
 */
export const CHILD_NUTRITION_TARGETS = {
  toddler: {
    label: 'Toddler (1-3)',
    rank: 1,
    protein: 13,
    calcium: 500,
    iron: 7,
  },
  child: {
    label: 'Child (4-12)',
    rank: 2,
    protein: 19,
    calcium: 800,
    iron: 10,
  },
  teen: {
    label: 'Teen (13-18)',
    rank: 3,
    protein: 45,
    calcium: 1300,
    iron: 13,
  },
};

export const NUTRITION_MEDICAL_DISCLAIMER = 'Estimated values. Not medical advice.';
export const CHILD_GUIDANCE_DISCLAIMER =
  'General guidance. Ask a doctor or dietitian for your child\'s needs.';

function isFiniteNonNeg(val) {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val) && val >= 0;
}

/**
 * Sum the adults' nutritionPerServing across a day's cooked meals, scaled by servings,
 * and compare against general adult daily targets (Protein 50g, Calcium 1000mg,
 * Iron 18mg female / 8mg male, Fiber 25g).
 * Returns null metrics when there are no meals so the UI displays "-".
 *
 * @param {Array<{ recipeId: string, servings?: number }>} dayMeals
 * @param {Map<string, object>|Record<string, object>} recipeMap
 * @param {"female"|"male"} [ironReference="female"]
 */
export function computeDayNutritionSummary(dayMeals, recipeMap, ironReference = 'female') {
  const meals = Array.isArray(dayMeals) ? dayMeals.filter(Boolean) : [];
  const ironTarget =
    ironReference === 'male'
      ? ADULT_NUTRITION_TARGETS.ironMale
      : ADULT_NUTRITION_TARGETS.ironFemale;

  if (meals.length === 0) {
    return {
      mealCount: 0,
      countedMeals: 0,
      totals: {
        protein: null,
        calcium: null,
        iron: null,
        fiber: null,
        calories: null,
      },
      targets: {
        protein: ADULT_NUTRITION_TARGETS.protein,
        calcium: ADULT_NUTRITION_TARGETS.calcium,
        iron: ironTarget,
        ironFemale: ADULT_NUTRITION_TARGETS.ironFemale,
        ironMale: ADULT_NUTRITION_TARGETS.ironMale,
        fiber: ADULT_NUTRITION_TARGETS.fiber,
      },
      percentages: {
        protein: null,
        calcium: null,
        iron: null,
        fiber: null,
      },
    };
  }

  let protein = 0;
  let calcium = 0;
  let iron = 0;
  let fiber = 0;
  let calories = 0;
  let hasProtein = false;
  let hasCalcium = false;
  let hasIron = false;
  let hasFiber = false;
  let hasCalories = false;
  let countedMeals = 0;

  for (const meal of meals) {
    const recipe =
      recipeMap instanceof Map
        ? recipeMap.get(meal.recipeId)
        : recipeMap?.[meal.recipeId] || getRecipeByIdSafe(meal.recipeId);
    const nut = recipe?.nutritionPerServing;
    if (!nut || typeof nut !== 'object') continue;

    const servings = Math.max(0.5, Number(meal.servings) || Number(recipe?.baseServings) || 1);
    let mealHasAny = false;

    if (isFiniteNonNeg(nut.protein)) {
      protein += nut.protein * servings;
      hasProtein = true;
      mealHasAny = true;
    }
    if (isFiniteNonNeg(nut.calcium)) {
      calcium += nut.calcium * servings;
      hasCalcium = true;
      mealHasAny = true;
    }
    if (isFiniteNonNeg(nut.iron)) {
      iron += nut.iron * servings;
      hasIron = true;
      mealHasAny = true;
    }
    if (isFiniteNonNeg(nut.fiber)) {
      fiber += nut.fiber * servings;
      hasFiber = true;
      mealHasAny = true;
    }
    if (isFiniteNonNeg(nut.calories)) {
      calories += nut.calories * servings;
      hasCalories = true;
      mealHasAny = true;
    }
    if (mealHasAny) countedMeals += 1;
  }

  const r1 = (n) => Math.round(n * 10) / 10;
  const finalProtein = hasProtein ? r1(protein) : null;
  const finalCalcium = hasCalcium ? Math.round(calcium) : null;
  const finalIron = hasIron ? r1(iron) : null;
  const finalFiber = hasFiber ? r1(fiber) : null;
  const finalCalories = hasCalories ? Math.round(calories) : null;

  return {
    mealCount: meals.length,
    countedMeals,
    totals: {
      protein: finalProtein,
      calcium: finalCalcium,
      iron: finalIron,
      fiber: finalFiber,
      calories: finalCalories,
    },
    targets: {
      protein: ADULT_NUTRITION_TARGETS.protein,
      calcium: ADULT_NUTRITION_TARGETS.calcium,
      iron: ironTarget,
      ironFemale: ADULT_NUTRITION_TARGETS.ironFemale,
      ironMale: ADULT_NUTRITION_TARGETS.ironMale,
      fiber: ADULT_NUTRITION_TARGETS.fiber,
    },
    percentages: {
      protein:
        finalProtein !== null
          ? Math.round((finalProtein / ADULT_NUTRITION_TARGETS.protein) * 100)
          : null,
      calcium:
        finalCalcium !== null
          ? Math.round((finalCalcium / ADULT_NUTRITION_TARGETS.calcium) * 100)
          : null,
      iron: finalIron !== null ? Math.round((finalIron / ironTarget) * 100) : null,
      fiber:
        finalFiber !== null
          ? Math.round((finalFiber / ADULT_NUTRITION_TARGETS.fiber) * 100)
          : null,
    },
  };
}

/**
 * Evaluate a recipe against the youngest child in a household.
 * Flags "Low in calcium" or "Low in iron" if a single serving provides
 * less than 20% of the youngest child's general target.
 *
 * @param {object} recipe
 * @param {{ adults?: number, children?: Array<{ ageGroup: "toddler"|"child"|"teen" }> } | null} household
 */
export function evaluateRecipeForChildren(recipe, household) {
  const children = Array.isArray(household?.children) ? household.children : [];
  if (children.length === 0) {
    return {
      hasChildren: false,
      youngestAgeGroup: null,
      youngestLabel: null,
      flags: [],
      isChildFriendly: true,
    };
  }

  let youngestAgeGroup = 'teen';
  let minRank = 99;
  for (const child of children) {
    const ag = child?.ageGroup;
    const spec = CHILD_NUTRITION_TARGETS[ag] || CHILD_NUTRITION_TARGETS.child;
    const resolvedAg = CHILD_NUTRITION_TARGETS[ag] ? ag : 'child';
    if (spec.rank < minRank) {
      minRank = spec.rank;
      youngestAgeGroup = resolvedAg;
    }
  }

  const target = CHILD_NUTRITION_TARGETS[youngestAgeGroup];
  const nut = recipe?.nutritionPerServing;
  const flags = [];

  if (nut && typeof nut === 'object') {
    if (isFiniteNonNeg(nut.calcium) && nut.calcium < target.calcium * 0.2) {
      flags.push('Low in calcium');
    }
    if (isFiniteNonNeg(nut.iron) && nut.iron < target.iron * 0.2) {
      flags.push('Low in iron');
    }
  }

  return {
    hasChildren: true,
    youngestAgeGroup,
    youngestLabel: target.label,
    flags,
    isChildFriendly: flags.length === 0,
  };
}

// Self-tests
(function runSelfTests() {
  const mockRecipeMap = new Map([
    [
      'palak_paneer',
      {
        id: 'palak_paneer',
        nutritionPerServing: {
          calories: 380,
          protein: 23,
          calcium: 410,
          iron: 4.9,
          fiber: 5.5,
        },
      },
    ],
    [
      'corn_chaat',
      {
        id: 'corn_chaat',
        nutritionPerServing: {
          calories: 140,
          protein: 4.5,
          calcium: 15,
          iron: 1.0,
          fiber: 3.0,
        },
      },
    ],
  ]);

  // Empty day returns null totals
  const emptyDay = computeDayNutritionSummary([], mockRecipeMap);
  console.assert(
    emptyDay.mealCount === 0 &&
      emptyDay.totals.protein === null &&
      emptyDay.totals.calcium === null &&
      emptyDay.totals.iron === null &&
      emptyDay.totals.fiber === null,
    'Empty day must return null nutrition totals'
  );

  // Scaled servings sum cleanly and iron switches between 18 mg (female) and 8 mg (male)
  const dayWithMeals = computeDayNutritionSummary(
    [{ recipeId: 'palak_paneer', servings: 2 }],
    mockRecipeMap,
    'female'
  );
  console.assert(
    dayWithMeals.totals.protein === 46 &&
      dayWithMeals.totals.calcium === 820 &&
      dayWithMeals.totals.iron === 9.8 &&
      dayWithMeals.totals.fiber === 11 &&
      dayWithMeals.targets.iron === 18,
    `Unexpected scaled daily nutrition: ${JSON.stringify(dayWithMeals)}`
  );

  const dayMale = computeDayNutritionSummary(
    [{ recipeId: 'palak_paneer', servings: 2 }],
    mockRecipeMap,
    'male'
  );
  console.assert(
    dayMale.targets.iron === 8 && dayMale.percentages.iron === 123,
    `Expected male iron target 8 mg and 123%, got ${JSON.stringify(dayMale)}`
  );

  // Child-friendly evaluation flags <20% calcium & iron for youngest child
  const childCheckFail = evaluateRecipeForChildren(
    mockRecipeMap.get('corn_chaat'),
    { adults: 2, children: [{ ageGroup: 'teen' }, { ageGroup: 'toddler' }] }
  );
  console.assert(
    childCheckFail.youngestAgeGroup === 'toddler' &&
      childCheckFail.flags.includes('Low in calcium') &&
      childCheckFail.flags.includes('Low in iron') &&
      childCheckFail.isChildFriendly === false,
    `Expected toddler threshold flags on corn_chaat, got ${JSON.stringify(childCheckFail)}`
  );

  const childCheckPass = evaluateRecipeForChildren(
    mockRecipeMap.get('palak_paneer'),
    { adults: 2, children: [{ ageGroup: 'toddler' }] }
  );
  console.assert(
    childCheckPass.isChildFriendly === true && childCheckPass.flags.length === 0,
    'Expected palak_paneer to pass child-friendly calcium & iron check'
  );
})();
