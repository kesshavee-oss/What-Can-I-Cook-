import React, { useMemo, useState } from 'react';
import {
  BellRing,
  ChevronRight,
  Clock,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { INGREDIENTS, RECIPES } from '../../recipes.js';
import { AllergyKey, DietType, Recipe } from '../../types/cook';
import { getMissingRecipeIngredientsCount } from '../../utils/groceryUtils.js';
import { getPantryExpirySummary } from '../../utils/pantryExpiry';
import { DietBadge } from '../DietBadge';
import { RecipeVisual } from '../RecipeVisual.jsx';

interface PantryInventoryNoticeProps {
  selectedIngredientIds: string[];
  defaultDiet: DietType;
  allergies: AllergyKey[];
  aiRecipes?: Recipe[];
  showVisuals?: boolean;
  onOpenRecipeById: (recipeId: string) => void;
  onUseExpiringInCook: (ingredientIds: string[]) => void;
  onAddRecipeToList?: (
    recipe: Recipe,
    includeOptional?: boolean,
    ownedIngredientIds?: string[]
  ) => string;
  onNotify?: (message: string) => void;
}

export const PantryInventoryNotice: React.FC<PantryInventoryNoticeProps> = ({
  selectedIngredientIds,
  defaultDiet,
  allergies,
  aiRecipes = [],
  showVisuals = true,
  onOpenRecipeById,
  onUseExpiringInCook,
  onAddRecipeToList,
  onNotify,
}) => {
  const [dismissed, setDismissed] = useState(false);

  const summary = useMemo(
    () =>
      getPantryExpirySummary({
        ingredients: INGREDIENTS,
        recipes: RECIPES,
        aiRecipes,
        selectedIngredientIds,
        defaultDiet,
        allergies,
      }),
    [aiRecipes, selectedIngredientIds, defaultDiet, allergies]
  );

  if (summary.items.length === 0) {
    return null;
  }

  if (dismissed) {
    return (
      <div className="flex items-center justify-between gap-3 bg-[#FFFDF9] rounded-2xl px-4 py-3 border border-[#EADFD2]">
        <div className="flex items-center gap-2.5 min-w-0">
          <BellRing className="w-4 h-4 text-[#8A4B08] shrink-0" aria-hidden="true" />
          <p className="text-sm text-[#2B2B2B] truncate tabular-nums">
            Pantry Inventory: {summary.items.length}{' '}
            {summary.items.length === 1 ? 'ingredient' : 'ingredients'} nearing expiry
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(false)}
          className="min-h-[44px] px-3 rounded-xl text-sm font-medium text-[#B83915] hover:bg-[#FFF1EC] shrink-0 cursor-pointer"
        >
          Show notice
        </button>
      </div>
    );
  }

  const expiringIds = summary.items.map((item) => item.ingredient.id);

  return (
    <section
      role="region"
      aria-labelledby="pantry-inventory-heading"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-5"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FFF1DC] text-[#8A4B08] flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h2
                id="pantry-inventory-heading"
                className="font-heading text-lg font-semibold text-[#2B2B2B]"
              >
                Pantry Inventory
              </h2>
              <span className="text-xs font-semibold text-[#8A4B08] tabular-nums">
                {summary.items.length}{' '}
                {summary.items.length === 1 ? 'item' : 'items'} nearing expiry
              </span>
            </div>
            <p className="text-sm text-[#6B6B6B] mt-0.5 leading-relaxed">
              {summary.hasSelectedExpiring
                ? 'These ingredients from your kitchen are nearing their expiry date. Use them in a meal soon.'
                : 'Fresh ingredients nearing expiry in your pantry catalog. Add them to Cook or pick a suggested recipe below.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss pantry inventory notification"
          className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-xl text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FFF9F2] flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Expiring ingredients list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {summary.items.map((item) => {
          const isUrgent = item.daysRemaining <= 1;
          return (
            <div
              key={item.ingredient.id}
              className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]"
            >
              <div className="min-w-0">
                <span className="block font-medium text-sm text-[#2B2B2B] truncate">
                  {item.ingredient.name}
                </span>
                <span className="block text-xs text-[#6B6B6B] tabular-nums">
                  {item.inPantry ? 'In your kitchen · ' : 'Fresh item · '}
                  Best by {item.formattedDate}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums shrink-0 ${
                  isUrgent ? 'text-[#B83915]' : 'text-[#8A4B08]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{item.statusLabel}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Suggested recipes using expiring ingredients */}
      {summary.suggestions.length > 0 && (
        <div className="space-y-2.5 pt-1 border-t border-[#F3EAE0]">
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <h3 className="font-heading text-sm font-semibold text-[#2B2B2B]">
              Suggested recipes to use them up
            </h3>
            <button
              type="button"
              onClick={() => onUseExpiringInCook(expiringIds)}
              className="min-h-[44px] px-3.5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
              <span>Cook with these ingredients</span>
            </button>
          </div>

          <ul className="divide-y divide-[#F3EAE0]">
            {summary.suggestions.map(({ recipe, usedExpiringIngredients, totalMinutes }) => {
              const isAi = Boolean(recipe.isAiGenerated || recipe.source === 'ai');
              const usedNames = usedExpiringIngredients
                .map((ing) => ing.name)
                .join(', ');
              const hideAddButton =
                defaultDiet === 'veg' && recipe.diet === 'nonveg';
              const missingRequiredCount = !hideAddButton
                ? getMissingRecipeIngredientsCount(recipe, selectedIngredientIds, false)
                : 0;

              return (
                <li
                  key={recipe.id}
                  className="py-1.5 first:pt-0 last:pb-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onOpenRecipeById(recipe.id)}
                    className="flex-1 min-w-0 min-h-[52px] py-1.5 px-2 -mx-2 rounded-xl hover:bg-[#FFF9F2] text-left flex items-center justify-between gap-3 group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <RecipeVisual
                        recipe={recipe}
                        variant="square"
                        showVisual={showVisuals}
                      />
                      <DietBadge diet={recipe.diet} showLabel={false} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-semibold text-sm text-[#2B2B2B] group-hover:text-[#B83915] truncate">
                            {recipe.name}
                          </span>
                          {isAi && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#6B3FA0]/10 text-[#5B2E91] text-[10px] font-semibold shrink-0">
                              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                              <span>AI</span>
                            </span>
                          )}
                        </div>
                        <span className="block text-xs text-[#6B6B6B] tabular-nums truncate">
                          Uses {usedNames}
                          {totalMinutes > 0 ? ` · ${totalMinutes} min` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#B83915] shrink-0"
                      aria-hidden="true"
                    />
                  </button>

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
                      aria-label={`Add missing ingredients for ${recipe.name} to grocery list`}
                      className="min-h-[44px] px-2.5 rounded-xl border border-[#EADFD2] bg-[#FFFDF9] hover:border-[#2E8B57] hover:bg-[#2E8B57]/10 text-xs font-semibold text-[#1F623D] inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <ShoppingBasket className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add missing to list</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};
