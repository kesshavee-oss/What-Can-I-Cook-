import React from 'react';
import { Ingredient } from '../types/cook';
import { IngredientTile } from './IngredientTile.jsx';

interface ChipGroupProps {
  title?: string;
  ingredients: Ingredient[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyMessage?: string;
  showIngredientImages?: boolean;
}

/**
 * Reusable grid of accessible ingredient tiles for a category or search result group.
 */
export const ChipGroup: React.FC<ChipGroupProps> = ({
  title,
  ingredients,
  selectedIds,
  onToggle,
  emptyMessage,
  showIngredientImages = true,
}) => {
  if (ingredients.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-[#6B6B6B] py-4 text-center">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className="space-y-2.5">
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
          {title}
        </h3>
      )}
      <div
        className={
          showIngredientImages
            ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3'
            : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5'
        }
      >
        {ingredients.map((ing) => {
          const isSelected = selectedIds.includes(ing.id);
          return (
            <IngredientTile
              key={ing.id}
              ingredient={ing}
              selected={isSelected}
              onClick={() => onToggle(ing.id)}
              size="tile"
              showImage={showIngredientImages}
            />
          );
        })}
      </div>
    </div>
  );
};
