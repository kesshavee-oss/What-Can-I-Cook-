import React from 'react';
import { DietType } from '../types/cook';

interface DietBadgeProps {
  diet: DietType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const DietBadge: React.FC<DietBadgeProps> = ({
  diet,
  showLabel = true,
  size = 'sm',
}) => {
  const isVeg = diet === 'veg';
  const boxSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      {isVeg ? (
        <span
          className={`${boxSize} rounded-full border-2 border-[#1F6E42] flex items-center justify-center shrink-0`}
          aria-hidden="true"
        >
          <span className={`${dotSize} rounded-full bg-[#1F6E42]`} />
        </span>
      ) : (
        <span
          className={`${boxSize} rounded-[3px] border-2 border-[#A63429] flex items-center justify-center shrink-0`}
          aria-hidden="true"
        >
          <span className={`${dotSize} rounded-[1px] bg-[#A63429]`} />
        </span>
      )}
      {showLabel && (
        <span
          className={`text-xs font-medium ${
            isVeg ? 'text-[#1F6E42]' : 'text-[#A63429]'
          }`}
        >
          {isVeg ? 'Veg' : 'Non-veg'}
        </span>
      )}
    </span>
  );
};
