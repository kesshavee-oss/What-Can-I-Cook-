// Pure SVG visual selection helpers for "What Can I Cook?".
import { RECIPES, RECIPE_VISUALS, getIngredientById } from '../recipes.js';

export const VISUAL_PALETTE = {
  tomato: '#E4572E',
  herbGreen: '#2E8B57',
  turmeric: '#E9A23B',
  cream: '#FFF1DC',
  deepBrown: '#6B3E26',
};

export const VALID_VISUAL_ICONS = new Set([
  'bowl',
  'plate',
  'pan',
  'pot',
  'wrap',
  'cup',
  'skewer',
  'leaf',
]);

const FORBIDDEN_VEG_COLORS = new Set([
  VISUAL_PALETTE.tomato,
  VISUAL_PALETTE.deepBrown,
]);

/**
 * Determine whether a recipe contains egg via allergens or ingredients.
 * @param {object} recipe
 * @returns {boolean}
 */
export function isEggRecipe(recipe) {
  if (!recipe || typeof recipe !== 'object') return false;
  if (Array.isArray(recipe.allergens) && recipe.allergens.includes('egg')) {
    return true;
  }
  if (Array.isArray(recipe.ingredients)) {
    return recipe.ingredients.some((item) => {
      const ing = getIngredientById(item?.ingredientId);
      return Boolean(ing?.isEgg) || item?.ingredientId === 'egg';
    });
  }
  return false;
}

/**
 * Choose a dish illustration icon from a recipe's tags, name, and mealTypes.
 * @param {object} recipe
 * @returns {"bowl"|"plate"|"pan"|"pot"|"wrap"|"cup"|"skewer"|"leaf"}
 */
export function pickIconForRecipe(recipe) {
  const tagsText = Array.isArray(recipe?.tags)
    ? recipe.tags.join(' ').toLowerCase()
    : '';
  const nameText = typeof recipe?.name === 'string' ? recipe.name.toLowerCase() : '';
  const combined = `${tagsText} ${nameText}`;

  if (/\b(wrap|roll|kathi|sandwich|toast|toastie|toasties)\b/.test(combined)) {
    return 'wrap';
  }
  if (/\b(skewer|tikka|kebab|bites|roast|grill|grilled)\b/.test(combined)) {
    return 'skewer';
  }
  if (/\b(salad|chaat|sprouts|palak|spinach|fruit|leafy|fresh)\b/.test(combined)) {
    return 'leaf';
  }
  if (/\b(porridge|oats|drink|tea|coffee|soup|broth|cup)\b/.test(combined)) {
    return 'cup';
  }
  if (
    /\b(omelette|bhurji|dosa|chilla|fry|fried|sear|seared|cutlet|stir|tawa|pan)\b/.test(
      combined
    )
  ) {
    return 'pan';
  }
  if (
    /\b(curry|dal|stew|chole|rajma|masala|khichdi|biryani|one-pot|pot)\b/.test(
      combined
    )
  ) {
    return 'pot';
  }
  if (/\b(idli|paratha|pav|platter|plate)\b/.test(combined)) {
    return 'plate';
  }
  if (/\b(poha|upma|pulao|rice|bowl)\b/.test(combined)) {
    return 'bowl';
  }

  const primaryMealType = Array.isArray(recipe?.mealTypes)
    ? recipe.mealTypes[0]
    : recipe?.mealType;

  switch (primaryMealType) {
    case 'breakfast':
      return 'pan';
    case 'snacks':
      return 'cup';
    case 'lunch':
      return 'plate';
    case 'dinner':
      return 'pot';
    default:
      return 'bowl';
  }
}

/**
 * Resolve a recipe's visual config ({ color, accent, icon, photoPath? }) using RECIPE_VISUALS
 * or deterministic diet-, egg-, and mealType-aware defaults for custom/AI recipes.
 * @param {object} recipe
 * @returns {{ color: string, accent: string, icon: "bowl"|"plate"|"pan"|"pot"|"wrap"|"cup"|"skewer"|"leaf", photoPath?: string }}
 */
export function getVisualForRecipe(recipe) {
  const id = typeof recipe?.id === 'string' ? recipe.id : '';
  const mapped = id && RECIPE_VISUALS && RECIPE_VISUALS[id] ? RECIPE_VISUALS[id] : null;
  const diet = recipe?.diet === 'nonveg' ? 'nonveg' : 'veg';
  const explicitPhoto =
    typeof recipe?.photoPath === 'string' && recipe.photoPath.trim().length > 0
      ? recipe.photoPath.trim()
      : typeof mapped?.photoPath === 'string' && mapped.photoPath.trim().length > 0
      ? mapped.photoPath.trim()
      : undefined;

  if (
    mapped &&
    typeof mapped.color === 'string' &&
    typeof mapped.accent === 'string' &&
    VALID_VISUAL_ICONS.has(mapped.icon)
  ) {
    if (
      diet !== 'veg' ||
      (!FORBIDDEN_VEG_COLORS.has(mapped.accent) &&
        !FORBIDDEN_VEG_COLORS.has(mapped.color))
    ) {
      return {
        color: mapped.color,
        accent: mapped.accent,
        icon: mapped.icon,
        ...(explicitPhoto ? { photoPath: explicitPhoto } : {}),
      };
    }
  }

  const icon = pickIconForRecipe(recipe);

  if (diet === 'nonveg') {
    const primaryMealType = Array.isArray(recipe?.mealTypes)
      ? recipe.mealTypes[0]
      : recipe?.mealType;
    const useBrown = primaryMealType === 'dinner' || icon === 'skewer' || icon === 'pot';
    return {
      color: primaryMealType === 'snacks' ? VISUAL_PALETTE.turmeric : VISUAL_PALETTE.cream,
      accent: useBrown ? VISUAL_PALETTE.deepBrown : VISUAL_PALETTE.tomato,
      icon,
      ...(explicitPhoto ? { photoPath: explicitPhoto } : {}),
    };
  }

  if (isEggRecipe(recipe)) {
    return {
      color: VISUAL_PALETTE.cream,
      accent: VISUAL_PALETTE.turmeric,
      icon,
      ...(explicitPhoto ? { photoPath: explicitPhoto } : {}),
    };
  }

  return {
    color: VISUAL_PALETTE.cream,
    accent: VISUAL_PALETTE.herbGreen,
    icon,
    ...(explicitPhoto ? { photoPath: explicitPhoto } : {}),
  };
}

// Self-tests
(function runSelfTests() {
  const allowedColors = new Set(Object.values(VISUAL_PALETTE));

  for (const recipe of RECIPES) {
    const visual = getVisualForRecipe(recipe);
    console.assert(
      visual &&
        allowedColors.has(visual.color) &&
        allowedColors.has(visual.accent) &&
        VALID_VISUAL_ICONS.has(visual.icon),
      `Recipe "${recipe.id}" returned invalid visual: ${JSON.stringify(visual)}`
    );

    if (recipe.diet === 'veg') {
      console.assert(
        !FORBIDDEN_VEG_COLORS.has(visual.accent) &&
          !FORBIDDEN_VEG_COLORS.has(visual.color),
        `Veg recipe "${recipe.id}" received forbidden red/brown color/accent: ${JSON.stringify(
          visual
        )}`
      );
      if (isEggRecipe(recipe)) {
        console.assert(
          visual.accent === VISUAL_PALETTE.turmeric,
          `Egg veg recipe "${recipe.id}" should use turmeric accent, got ${visual.accent}`
        );
      }
    } else {
      console.assert(
        visual.accent === VISUAL_PALETTE.tomato ||
          visual.accent === VISUAL_PALETTE.deepBrown,
        `Non-veg recipe "${recipe.id}" should use tomato/brown accent, got ${visual.accent}`
      );
    }
  }

  const unknownVeg = getVisualForRecipe({
    id: 'unknown_custom_id',
    name: 'Herbed Quinoa Salad',
    diet: 'veg',
    mealTypes: ['lunch'],
    tags: ['salad'],
  });
  console.assert(
    unknownVeg.icon === 'leaf' &&
      unknownVeg.accent === VISUAL_PALETTE.herbGreen &&
      !FORBIDDEN_VEG_COLORS.has(unknownVeg.accent),
    'Expected unknown veg recipe to resolve to valid green leaf default visual'
  );

  const unknownAiEgg = getVisualForRecipe({
    id: 'ai_quick_egg_wrap',
    source: 'ai',
    isAiGenerated: true,
    name: 'Quick Egg Wrap',
    diet: 'veg',
    allergens: ['egg'],
    mealTypes: ['breakfast'],
    tags: ['quick'],
  });
  console.assert(
    unknownAiEgg.icon === 'wrap' && unknownAiEgg.accent === VISUAL_PALETTE.turmeric,
    'Expected AI egg recipe to resolve to wrap icon with turmeric accent'
  );

  const unknownNonVeg = getVisualForRecipe({
    id: 'unknown_nonveg_999',
    name: 'Spiced Chicken Curry',
    diet: 'nonveg',
    mealTypes: ['dinner'],
    tags: [],
  });
  console.assert(
    unknownNonVeg.icon === 'pot' &&
      (unknownNonVeg.accent === VISUAL_PALETTE.tomato ||
        unknownNonVeg.accent === VISUAL_PALETTE.deepBrown),
    'Expected unknown non-veg recipe to resolve to valid pot visual'
  );
})();
