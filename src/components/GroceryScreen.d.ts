import React from 'react';
import { GroceryItem, PriceMap, Recipe } from '../types/cook';

export interface GroceryScreenProps {
  groceryList: GroceryItem[];
  prices: PriceMap;
  priceOverrides: PriceMap;
  showCost: boolean;
  showIngredientImages?: boolean;
  aiRecipes?: Recipe[];
  initialOpenPriceEdit?: boolean;
  onInitialPriceEditHandled?: () => void;
  storageUnavailable: boolean;
  onToggleChecked: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onClearChecked: () => void;
  onClearAll: () => void;
  onSavePrices: (nextOverrides: PriceMap) => void;
  onResetItemPrice: (ingredientId: string) => void;
  onGoToCook: () => void;
}

export const GroceryScreen: React.FC<GroceryScreenProps>;
