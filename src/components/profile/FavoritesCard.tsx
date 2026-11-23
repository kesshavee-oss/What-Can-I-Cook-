import React, { useEffect, useMemo, useState } from 'react';
import { Heart, ShoppingBasket, Sparkles } from 'lucide-react';
import { RECIPES } from '../../recipes.js';
import { DietType, Recipe } from '../../types/cook';
import { AI_DISCLAIMER_TEXT } from '../../utils/aiRecipes.js';
import { getMissingRecipeIngredientsCount } from '../../utils/groceryUtils.js';
import { DietBadge } from '../DietBadge';
import { RecipeVisual } from '../RecipeVisual.jsx';

type FavoriteSort = 'recent' | 'name' | 'quickest';

interface FavoritesCardProps {
  favoriteRecipeIds: string[];
  aiRecipes?: Recipe[];
  selectedIngredientIds?: string[];
  defaultDiet?: DietType;
  showVisuals?: boolean;
  onOpenRecipeById: (recipeId: string) => void;
  onRemoveFavorite: (recipeId: string) => void;
  onAddRecipeToList?: (
    recipe: Recipe,
    includeOptional?: boolean,
    ownedIngredientIds?: string[]
  ) => string;
  onNotify?: (message: string) => void;
}

const SORT_OPTIONS: { id: FavoriteSort; label: string }[] = [
  { id: 'recent', label: 'Recently added' },
  { id: 'name', label: 'Name A-Z' },
  { id: 'quickest', label: 'Quickest' },
];

function safeText(val: unknown): string {
  if (val === undefined || val === null) return '-';
  const s = String(val).trim();
  return s.length > 0 ? s : '-';
}

/**
 * Saved favorite recipes card with sort controls, missing-ID graceful fallback
 * ("Recipe unavailable"), row tap to open recipe detail, AI disclaimer, and remove button.
 */
export const FavoritesCard: React.FC<FavoritesCardProps> = ({
  favoriteRecipeIds,
  aiRecipes = [],
  selectedIngredientIds = [],
  defaultDiet = 'veg',
  showVisuals = true,
  onOpenRecipeById,
  onRemoveFavorite,
  onAddRecipeToList,
  onNotify,
}) => {
  const [sortBy, setSortBy] = useState<FavoriteSort>('recent');

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>(RECIPES.map((r) => [r.id, r]));
    for (const r of aiRecipes) {
      map.set(r.id, r);
    }
    return map;
  }, [aiRecipes]);

  // Warn once when saved favorite IDs no longer exist in recipes.js
  useEffect(() => {
    for (const id of favoriteRecipeIds) {
      if (!recipeMap.has(id)) {
        console.warn(`Favorite recipe id "${id}" not found in recipes.js; showing unavailable row.`);
      }
    }
  }, [favoriteRecipeIds, recipeMap]);

  const sortedFavorites = useMemo(() => {
    const orderedIds = [...favoriteRecipeIds].reverse();
    const resolved = orderedIds.map((id) => ({
      id,
      recipe: recipeMap.get(id) ?? null,
    }));

    if (sortBy === 'name') {
      return [...resolved].sort((a, b) =>
        (a.recipe?.name ?? 'Recipe unavailable').localeCompare(
          b.recipe?.name ?? 'Recipe unavailable'
        )
      );
    }
    if (sortBy === 'quickest') {
      return [...resolved].sort((a, b) => {
        const aMins = a.recipe
          ? (Number(a.recipe.prepMinutes) || 0) + (Number(a.recipe.cookMinutes) || 0)
          : Number.MAX_SAFE_INTEGER;
        const bMins = b.recipe
          ? (Number(b.recipe.prepMinutes) || 0) + (Number(b.recipe.cookMinutes) || 0)
          : Number.MAX_SAFE_INTEGER;
        return aMins - bMins;
      });
    }
    return resolved;
  }, [favoriteRecipeIds, recipeMap, sortBy]);

  return (
    <section
      aria-labelledby="favorites-card-heading"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#B83915]" aria-hidden="true" />
          <h2
            id="favorites-card-heading"
            className="font-heading text-lg font-semibold text-[#2B2B2B]"
          >
            Favorites
          </h2>
          <span className="text-xs font-medium text-[#6B6B6B] tabular-nums">
            ({sortedFavorites.length})
          </span>
        </div>

        {sortedFavorites.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1 p-1 bg-[#FFF9F2] border border-[#EADFD2] rounded-xl max-w-full"
            role="group"
            aria-label="Sort favorites"
          >
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortBy(opt.id)}
                  aria-pressed={active}
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#2B2B2B] shadow-xs'
                      : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {sortedFavorites.length === 0 ? (
        <p className="text-sm text-[#6B6B6B] py-4 leading-relaxed">
          No favorites yet. Tap the heart on any recipe to save it here.
        </p>
      ) : (
        <ul className="divide-y divide-[#F3EAE0]">
          {sortedFavorites.map(({ id, recipe }) => {
            if (!recipe) {
              return (
                <li
                  key={id}
                  className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 py-1">
                    <span className="block font-heading font-semibold text-sm text-[#6B6B6B]">
                      Recipe unavailable
                    </span>
                    <span className="block text-xs text-[#6B6B6B]">
                      This saved recipe is no longer in your list.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(id)}
                    aria-label="Remove unavailable recipe from favorites"
                    className="min-w-[44px] min-h-[44px] rounded-xl text-[#B83915] hover:bg-[#C5411B]/10 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-[#B83915]" aria-hidden="true" />
                  </button>
                </li>
              );
            }

            const isAi = Boolean(recipe.isAiGenerated || recipe.source === 'ai');
            const totalMinutes =
              (Number(recipe.prepMinutes) || 0) + (Number(recipe.cookMinutes) || 0);
            const mealTypesText =
              Array.isArray(recipe.mealTypes) && recipe.mealTypes.length > 0
                ? recipe.mealTypes.join(' / ')
                : '-';
            const hideAddButton =
              defaultDiet === 'veg' && recipe.diet === 'nonveg';
            const missingRequiredCount = !hideAddButton
              ? getMissingRecipeIngredientsCount(recipe, selectedIngredientIds, false)
              : 0;

            return (
              <li
                key={recipe.id}
                className="py-2.5 first:pt-1 last:pb-1 space-y-1.5"
              >
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenRecipeById(recipe.id)}
                    className="flex-1 min-w-0 min-h-[48px] py-1 text-left flex items-center gap-3 group cursor-pointer"
                  >
                    <RecipeVisual
                      recipe={recipe}
                      variant="square"
                      showVisual={showVisuals}
                    />
                    <DietBadge diet={recipe.diet} showLabel={false} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="block font-heading font-semibold text-sm text-[#2B2B2B] group-hover:text-[#B83915] truncate">
                          {safeText(recipe.name)}
                        </span>
                        {isAi && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#6B3FA0]/10 text-[#5B2E91] text-[10px] font-semibold shrink-0">
                            <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                            <span>AI</span>
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-[#6B6B6B] capitalize tabular-nums truncate">
                        {mealTypesText} · {totalMinutes > 0 ? `${totalMinutes} min` : '-'}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {missingRequiredCount > 0 && onAddRecipeToList && (
                      <button
                        type="button"
                        onClick={() => {
                          const msg = onAddRecipeToList(
                            recipe,
                            false,
                            selectedIngredientIds
                          );
                          onNotify?.(msg);
                        }}
                        aria-label={`Add missing ingredients for ${safeText(recipe.name)} to grocery list`}
                        className="min-h-[44px] px-2.5 rounded-xl border border-[#EADFD2] bg-[#FFFDF9] hover:border-[#2E8B57] hover:bg-[#2E8B57]/10 text-xs font-semibold text-[#1F623D] inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                      >
                        <ShoppingBasket className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Add missing to list</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(recipe.id)}
                      aria-label={`Remove ${safeText(recipe.name)} from favorites`}
                      className="min-w-[44px] min-h-[44px] rounded-xl text-[#B83915] hover:bg-[#C5411B]/10 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-[#B83915]" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {isAi && (
                  <p
                    role="note"
                    className="text-[11px] text-[#5B2E91] bg-[#6B3FA0]/8 rounded-lg px-2.5 py-1.5 leading-snug"
                  >
                    {AI_DISCLAIMER_TEXT}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
