import React from 'react';
import { GroceryItem, PriceMap } from '../types/cook';

export interface PriceEditSheetProps {
  open: boolean;
  groceryList: GroceryItem[];
  prices: PriceMap;
  priceOverrides: PriceMap;
  onSavePrices: (nextOverrides: PriceMap) => void;
  onResetItemPrice?: (ingredientId: string) => void;
  onClose: () => void;
}

export const PriceEditSheet: React.FC<PriceEditSheetProps>;
