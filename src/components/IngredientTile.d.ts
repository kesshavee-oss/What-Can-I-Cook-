import React from 'react';
import { IngredientCategory, IngredientVisual } from '../types/cook';

export interface IngredientTileIngredient {
  id: string;
  name: string;
  category?: IngredientCategory;
  visual?: IngredientVisual;
}

export interface IngredientTileProps {
  ingredient: IngredientTileIngredient;
  selected?: boolean;
  onClick?: () => void;
  size?: 'tile' | 'sm';
  showImage?: boolean;
  className?: string;
}

export const IngredientTile: React.FC<IngredientTileProps>;
