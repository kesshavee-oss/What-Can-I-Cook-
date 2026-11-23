import React, { useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { INGREDIENTS, RECIPES, getRecipesForFilters } from '../../recipes.js';
import { AllergyKey } from '../../types/cook';

interface AllergyCardProps {
  allergies: AllergyKey[];
  onToggleAllergy: (allergy: AllergyKey) => void;
}

const ALLERGY_ITEMS: {
  id: AllergyKey;
  label: string;
  description: string;
}[] = [
  {
    id: 'dairy',
    label: 'Dairy',
    description: 'Hides recipes with milk, paneer, curd, butter, or ghee',
  },
  {
    id: 'gluten',
    label: 'Gluten',
    description: 'Hides recipes with wheat, bread, semolina, oats, or soy sauce',
  },
  {
    id: 'nut',
    label: 'Nuts',
    description: 'Hides recipes with peanuts or tree nuts',
  },
  {
    id: 'soy',
    label: 'Soy',
    description: 'Hides recipes with soy sauce or soy products',
  },
  {
    id: 'egg',
    label: 'Egg',
    description: 'Hides recipes with eggs, including veg-with-eggs dishes',
  },
];

const ALL_INGREDIENT_IDS = INGREDIENTS.map((ing) => ing.id);

/**
 * Allergy filters card with accessible toggle switches and live hidden-recipe count
 * computed directly through getRecipesForFilters in recipes.js.
 */
export const AllergyCard: React.FC<AllergyCardProps> = ({
  allergies,
  onToggleAllergy,
}) => {
  const hiddenCount = useMemo(() => {
    const allowed = getRecipesForFilters({
      diet: 'nonveg',
      allergies,
      availableIngredientIds: ALL_INGREDIENT_IDS,
    });
    return Math.max(0, RECIPES.length - allowed.length);
  }, [allergies]);

  return (
    <section
      aria-labelledby="allergy-card-heading"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#E4572E]" aria-hidden="true" />
          <h2
            id="allergy-card-heading"
            className="font-heading text-lg font-semibold text-[#2B2B2B]"
          >
            Allergies
          </h2>
        </div>

        <span className="text-xs font-medium text-[#6B6B6B] tabular-nums">
          {hiddenCount} {hiddenCount === 1 ? 'recipe' : 'recipes'} hidden by your
          allergy settings
        </span>
      </div>

      <div className="divide-y divide-[#F3EAE0]">
        {ALLERGY_ITEMS.map((item) => {
          const enabled = allergies.includes(item.id);
          const labelId = `allergy-label-${item.id}`;
          const descId = `allergy-desc-${item.id}`;

          return (
            <div
              key={item.id}
              className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <label
                  id={labelId}
                  htmlFor={`allergy-switch-${item.id}`}
                  className="block text-sm font-semibold text-[#2B2B2B] cursor-pointer"
                >
                  {item.label}
                </label>
                <p id={descId} className="text-xs text-[#6B6B6B] mt-0.5 leading-snug">
                  {item.description}
                </p>
              </div>

              <button
                id={`allergy-switch-${item.id}`}
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-labelledby={labelId}
                aria-describedby={descId}
                onClick={() => onToggleAllergy(item.id)}
                className="min-w-[48px] min-h-[44px] flex items-center justify-end shrink-0 cursor-pointer"
              >
                <span
                  aria-hidden="true"
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
                    enabled ? 'bg-[#C5411B]' : 'bg-[#DFD3C5]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#6B6B6B] pt-2 border-t border-[#F3EAE0] leading-relaxed">
        Allergy filters are a convenience, not a guarantee. Always check labels
        and ingredients.
      </p>
    </section>
  );
};
