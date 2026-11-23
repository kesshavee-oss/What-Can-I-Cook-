import React from 'react';
import { Check, Utensils } from 'lucide-react';
import { DietType } from '../../types/cook';
import { DietBadge } from '../DietBadge';

interface DietCardProps {
  defaultDiet: DietType;
  onSelectDefaultDiet: (diet: DietType) => void;
}

const DIET_CARDS: {
  id: DietType;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'veg',
    title: 'Vegetarian (includes eggs)',
    subtitle: 'Vegetables, pulses, paneer, dairy, grains, and egg dishes.',
  },
  {
    id: 'nonveg',
    title: 'Non-vegetarian',
    subtitle: 'Includes chicken, fish, prawns, and mutton alongside veg options.',
  },
];

/**
 * Default diet selector card. Selecting a card saves defaultDiet immediately
 * without altering saved meals or favorites.
 */
export const DietCard: React.FC<DietCardProps> = ({
  defaultDiet,
  onSelectDefaultDiet,
}) => {
  return (
    <section
      aria-labelledby="diet-card-heading"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4"
    >
      <div className="flex items-center gap-2">
        <Utensils className="w-5 h-5 text-[#E4572E]" aria-hidden="true" />
        <h2
          id="diet-card-heading"
          className="font-heading text-lg font-semibold text-[#2B2B2B]"
        >
          Diet preferences
        </h2>
      </div>

      <p className="text-xs text-[#6B6B6B] leading-relaxed">
        This pre-selects your diet on the Cook tab. You can still change it
        there for any meal.
      </p>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="radiogroup"
        aria-labelledby="diet-card-heading"
      >
        {DIET_CARDS.map((option) => {
          const isSelected = defaultDiet === option.id;
          const isVeg = option.id === 'veg';

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectDefaultDiet(option.id)}
              className={`min-h-[116px] p-4 rounded-xl border-2 text-left flex flex-col justify-between gap-3 transition-colors cursor-pointer ${
                isSelected
                  ? isVeg
                    ? 'border-[#1F6E42] bg-[#1F6E42]/6'
                    : 'border-[#C5411B] bg-[#C5411B]/6'
                  : 'border-[#EADFD2] bg-[#FFF9F2] hover:border-[#DFD3C5]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                {isSelected ? (
                  <DietBadge diet={option.id} showLabel={false} size="md" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-dashed border-[#DFD3C5]" aria-hidden="true" />
                )}

                {isSelected && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      isVeg ? 'text-[#1F6E42]' : 'text-[#B83915]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Default</span>
                  </span>
                )}
              </div>

              <div>
                <span className="block font-heading font-semibold text-sm text-[#2B2B2B]">
                  {option.title}
                </span>
                <span className="block text-xs text-[#6B6B6B] mt-1 leading-snug">
                  {option.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
