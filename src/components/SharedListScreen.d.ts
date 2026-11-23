import React from 'react';
import { GroceryItem } from '../types/cook';

export interface SharedListScreenProps {
  hashFragment: string;
  onOpenApp: () => void;
  onSaveCopy: (items: GroceryItem[]) => void;
}

export const SharedListScreen: React.FC<SharedListScreenProps>;
