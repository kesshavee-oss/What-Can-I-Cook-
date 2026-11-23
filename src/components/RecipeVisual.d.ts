import React from 'react';
import { Recipe } from '../types/cook';

export type RecipeVisualVariant = 'card' | 'detail' | 'square';

export interface RecipeVisualProps {
  recipe?: Partial<Recipe> | null;
  variant?: RecipeVisualVariant;
  showVisual?: boolean;
  className?: string;
}

export const RecipeVisual: React.FC<RecipeVisualProps>;
