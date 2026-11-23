import { IngredientCategory } from '../types/cook';

export const INGREDIENT_CATEGORIES: { id: IngredientCategory; label: string }[] = [
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'meat_fish', label: 'Meat & Fish' },
  { id: 'eggs_dairy', label: 'Eggs & Dairy' },
  { id: 'grains_pulses', label: 'Grains & Pulses' },
  { id: 'spices_herbs', label: 'Spices & Herbs' },
  { id: 'pantry', label: 'Pantry' },
];
