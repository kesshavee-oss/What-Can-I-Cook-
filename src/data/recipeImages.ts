import vegCurryImg from '../assets/images/recipe_veg_curry_1795076100840.jpg';
import vegBowlImg from '../assets/images/recipe_veg_bowl_1795076100841.jpg';
import vegSkilletImg from '../assets/images/recipe_veg_skillet_1795076101142.jpg';
import eggDishImg from '../assets/images/recipe_egg_dish_1795076101069.jpg';
import nonVegDishImg from '../assets/images/recipe_nonveg_dish_1795076101463.jpg';
import { Recipe, RecipeVisualIcon } from '../types/cook';
import { isEggRecipe } from '../utils/visualUtils.js';

export const RECIPE_PLACEHOLDER_IMAGES = {
  vegCurry: vegCurryImg,
  vegBowl: vegBowlImg,
  vegSkillet: vegSkilletImg,
  eggDish: eggDishImg,
  nonVegDish: nonVegDishImg,
} as const;

/**
 * Resolve a culinary placeholder image URL for any recipe that lacks an explicit `imageUrl`,
 * respecting veg / egg / non-veg diet distinctions and dish icon style.
 */
export function getRecipeImageUrl(
  recipe?: Partial<Recipe> | null,
  visualIcon?: RecipeVisualIcon
): string {
  const customUrl =
    typeof (recipe as { imageUrl?: unknown } | null)?.imageUrl === 'string'
      ? ((recipe as { imageUrl?: string }).imageUrl ?? '').trim()
      : '';
  if (customUrl.length > 0) {
    return customUrl;
  }

  if (recipe?.diet === 'nonveg') {
    return RECIPE_PLACEHOLDER_IMAGES.nonVegDish;
  }

  if (isEggRecipe(recipe ?? undefined)) {
    return RECIPE_PLACEHOLDER_IMAGES.eggDish;
  }

  if (visualIcon === 'pot') {
    return RECIPE_PLACEHOLDER_IMAGES.vegCurry;
  }

  if (visualIcon === 'bowl' || visualIcon === 'plate') {
    return RECIPE_PLACEHOLDER_IMAGES.vegBowl;
  }

  return RECIPE_PLACEHOLDER_IMAGES.vegSkillet;
}
