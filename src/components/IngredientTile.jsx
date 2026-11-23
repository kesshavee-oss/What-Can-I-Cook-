import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { getIngredientById } from '../recipes.js';

const FALLBACK_COLORS = {
  vegetables: '#E6F4EA',
  fruits: '#FDECD8',
  meat_fish: '#FCE5DE',
  eggs_dairy: '#FFF3D9',
  grains_pulses: '#F7F1E5',
  spices_herbs: '#FCEAC7',
  pantry: '#F3EFE8',
};

const FALLBACK_ICONS = {
  vegetables: 'leaf',
  fruits: 'fruit',
  meat_fish: 'meat',
  eggs_dairy: 'dairy',
  grains_pulses: 'grain',
  spices_herbs: 'spice',
  pantry: 'bottle',
};

/**
 * Draw one of 16 crisp, original ingredient vector icons inside a 64x64 viewBox.
 * Colors are chosen to maintain clear contrast over pastel ingredient tile backgrounds.
 */
function renderIngredientSvgShapes(icon) {
  switch (icon) {
    case 'leaf':
      return (
        <g>
          <path
            d="M16 48 C18 28, 32 16, 48 16 C48 34, 36 48, 16 48 Z"
            fill="#2E8B57"
            stroke="#1B5E3A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 52 C22 42, 34 30, 44 20"
            stroke="#FFFDF7"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M28 36 L26 27 M34 30 L42 32"
            stroke="#FFFDF7"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case 'root':
      return (
        <g>
          <path
            d="M32 22 C28 14, 22 12, 18 15 M32 22 C32 13, 32 10, 32 10 M32 22 C36 14, 42 12, 46 15"
            stroke="#1F6E42"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M21 24 C21 20, 43 20, 43 24 C43 35, 36 52, 32 54 C28 52, 21 35, 21 24 Z"
            fill="#E4572E"
            stroke="#9E2F12"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M26 30 H34 M28 38 H36"
            stroke="#FFF4CC"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>
      );

    case 'fruit':
      return (
        <g>
          <path
            d="M32 19 C32 14, 35 11, 39 11"
            stroke="#6B4423"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M32 18 C27 13, 21 13, 20 17 C24 20, 29 20, 32 18 Z"
            fill="#2E8B57"
            stroke="#1B5E3A"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M32 21 C43 19, 50 27, 48 39 C46 49, 39 53, 32 51 C25 53, 18 49, 16 39 C14 27, 21 19, 32 21 Z"
            fill="#DC4C2E"
            stroke="#9A2B15"
            strokeWidth="2.5"
          />
          <path
            d="M23 28 C21 32, 21 36, 23 40"
            stroke="#FFFDF7"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        </g>
      );

    case 'drop':
      return (
        <g>
          <path
            d="M32 12 C32 12, 48 29, 48 40 C48 48.8, 40.8 54, 32 54 C23.2 54, 16 48.8, 16 40 C16 29, 32 12, 32 12 Z"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M25 36 C24 41, 26 46, 30 48"
            stroke="#FFFDF7"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case 'grain':
      return (
        <g>
          <line
            x1="32"
            y1="52"
            x2="32"
            y2="14"
            stroke="#92400E"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <ellipse
            cx="25"
            cy="24"
            rx="4.5"
            ry="7"
            transform="rotate(-28 25 24)"
            fill="#D97706"
            stroke="#78350F"
            strokeWidth="2"
          />
          <ellipse
            cx="39"
            cy="24"
            rx="4.5"
            ry="7"
            transform="rotate(28 39 24)"
            fill="#F59E0B"
            stroke="#78350F"
            strokeWidth="2"
          />
          <ellipse
            cx="25"
            cy="35"
            rx="4.5"
            ry="7"
            transform="rotate(-28 25 35)"
            fill="#F59E0B"
            stroke="#78350F"
            strokeWidth="2"
          />
          <ellipse
            cx="39"
            cy="35"
            rx="4.5"
            ry="7"
            transform="rotate(28 39 35)"
            fill="#D97706"
            stroke="#78350F"
            strokeWidth="2"
          />
          <ellipse
            cx="32"
            cy="15"
            rx="4"
            ry="6.5"
            fill="#F59E0B"
            stroke="#78350F"
            strokeWidth="2"
          />
        </g>
      );

    case 'bean':
      return (
        <g>
          <ellipse
            cx="25"
            cy="27"
            rx="9"
            ry="13"
            transform="rotate(-24 25 27)"
            fill="#C2410C"
            stroke="#7C2D12"
            strokeWidth="2.3"
          />
          <path
            d="M22 22 C24 26, 24 30, 22 33"
            stroke="#FDE68A"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse
            cx="40"
            cy="38"
            rx="9"
            ry="13"
            transform="rotate(22 40 38)"
            fill="#D97706"
            stroke="#7C2D12"
            strokeWidth="2.3"
          />
          <path
            d="M38 33 C36 37, 36 41, 38 44"
            stroke="#FFFDF7"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case 'egg':
      return (
        <g>
          <path
            d="M28 14 C37 14, 43 27, 43 38 C43 46.5, 36.5 52, 28 52 C19.5 52, 13 46.5, 13 38 C13 27, 19 14, 28 14 Z"
            fill="#FFFDF7"
            stroke="#8B6F4E"
            strokeWidth="2.4"
          />
          <circle
            cx="42"
            cy="40"
            r="12"
            fill="#FFFDF7"
            stroke="#8B6F4E"
            strokeWidth="2.4"
          />
          <circle cx="42" cy="40" r="6.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
        </g>
      );

    case 'meat':
      return (
        <g>
          <path
            d="M16 39 C14 27, 25 17, 39 19 C48 20, 52 28, 49 38 C46 47, 33 51, 22 48 C18 47, 17 44, 16 39 Z"
            fill="#B8392E"
            stroke="#7F1D1D"
            strokeWidth="2.5"
          />
          <circle cx="38" cy="31" r="6.5" fill="#FFFDF7" stroke="#7F1D1D" strokeWidth="2" />
          <circle cx="38" cy="31" r="2.5" fill="#D6C3B3" />
          <path
            d="M22 36 Q27 32 30 39"
            stroke="#FCA5A5"
            strokeWidth="2.3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case 'fish':
      return (
        <g>
          <path
            d="M44 32 L54 23 V41 Z"
            fill="#2563EB"
            stroke="#1E3A8A"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 32 C18 20, 34 20, 45 32 C34 44, 18 44, 12 32 Z"
            fill="#3B82F6"
            stroke="#1E3A8A"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="30" r="2.5" fill="#FFFDF7" />
          <path
            d="M29 27 C31 30, 31 34, 29 37"
            stroke="#DBEAFE"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case 'dairy':
      return (
        <g>
          <path
            d="M23 13 H41 L43 22 V50 C43 52, 41 53, 39 53 H25 C23 53, 21 52, 21 50 V22 Z"
            fill="#FFFFFF"
            stroke="#334155"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <rect
            x="23"
            y="11"
            width="18"
            height="5"
            rx="2"
            fill="#2563EB"
            stroke="#1E3A8A"
            strokeWidth="1.8"
          />
          <rect x="24" y="29" width="16" height="12" rx="2" fill="#DBEAFE" />
          <path d="M27 35 H37" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );

    case 'spice':
      return (
        <g>
          <path
            d="M32 13 L35 26 L47 21 L38 32 L50 38 L37 39 L40 51 L31 41 L21 50 L25 38 L13 35 L26 30 L19 19 L30 26 Z"
            fill="#D97706"
            stroke="#78350F"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="33" r="4.5" fill="#B83915" stroke="#78350F" strokeWidth="1.8" />
        </g>
      );

    case 'bottle':
      return (
        <g>
          <rect
            x="27"
            y="11"
            width="10"
            height="6"
            rx="1.5"
            fill="#B45309"
            stroke="#78350F"
            strokeWidth="2"
          />
          <path
            d="M27 17 H37 L38 22 L43 27 V49 C43 51.5, 41 53, 38.5 53 H25.5 C23 53, 21 51.5, 21 49 V27 L26 22 Z"
            fill="#1F6E42"
            stroke="#14532D"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <rect x="24" y="32" width="16" height="13" rx="2" fill="#FFF9F2" />
          <path d="M27 38 H37" stroke="#C5411B" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );

    case 'bowl':
      return (
        <g>
          <path
            d="M24 20 C22 16, 26 14, 24 11 M32 19 C30 15, 34 13, 32 10 M40 20 C38 16, 42 14, 40 11"
            stroke="#9A3412"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M14 29 H50 C50 42, 42 49, 32 49 C22 49, 14 42, 14 29 Z"
            fill="#C5411B"
            stroke="#7C2D12"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <ellipse
            cx="32"
            cy="29"
            rx="18"
            ry="4.5"
            fill="#FDE68A"
            stroke="#7C2D12"
            strokeWidth="2.2"
          />
          <rect x="25" y="49" width="14" height="4" rx="2" fill="#7C2D12" />
        </g>
      );

    case 'pepper':
      return (
        <g>
          <path
            d="M42 15 C45 13, 49 14, 50 18"
            stroke="#1F6E42"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M36 20 C41 17, 47 21, 46 27 C43 40, 30 50, 14 49 C12 49, 12 46, 15 44 C25 40, 30 32, 33 23 C34 21, 35 20, 36 20 Z"
            fill="#DC2626"
            stroke="#991B1B"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M37 25 C34 32, 29 39, 22 43"
            stroke="#FCA5A5"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case 'nut':
      return (
        <g>
          <path
            d="M32 14 C42 20, 47 32, 42 43 C39 49, 35 52, 32 52 C29 52, 25 49, 22 43 C17 32, 22 20, 32 14 Z"
            fill="#B45309"
            stroke="#78350F"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M28 24 C27 31, 27 38, 29 45 M35 23 C36 30, 36 38, 34 45"
            stroke="#FDE68A"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case 'mushroom':
      return (
        <g>
          <path
            d="M26 34 H38 L40 50 C40 51.5, 38.5 53, 36.5 53 H27.5 C25.5 53, 24 51.5, 24 50 Z"
            fill="#F5EFE6"
            stroke="#785A42"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M14 34 C14 21, 22 14, 32 14 C42 14, 50 21, 50 34 C50 36, 47 37, 44 37 H20 C17 37, 14 36, 14 34 Z"
            fill="#9C7B63"
            stroke="#5C4033"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="25" cy="25" r="2.8" fill="#FFFDF7" />
          <circle cx="37" cy="22" r="2.2" fill="#FFFDF7" />
          <circle cx="40" cy="30" r="2" fill="#FFFDF7" />
        </g>
      );

    default:
      return (
        <g>
          <circle
            cx="32"
            cy="32"
            r="16"
            fill="#2E8B57"
            stroke="#1B5E3A"
            strokeWidth="2.4"
          />
          <path
            d="M24 32 H40 M32 24 V40"
            stroke="#FFFDF7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );
  }
}

/**
 * IngredientTile renders an ingredient visual tile in two modes:
 * - 'tile' (Cook Step 3): 96px square (72px on 360px screens) with SVG/image + name below,
 *   green border & green check badge when selected, and plain name-only tile when showImage=false.
 * - 'sm' (Grocery rows & RecipeDetail rows): compact 40px rounded square with SVG/image,
 *   or hidden when showImage=false.
 */
export const IngredientTile = ({
  ingredient,
  selected = false,
  onClick,
  size = 'tile',
  showImage = true,
  className = '',
}) => {
  const catalog =
    ingredient?.id && !ingredient?.visual
      ? getIngredientById(ingredient.id)
      : null;
  const name =
    typeof ingredient?.name === 'string' && ingredient.name.trim()
      ? ingredient.name.trim()
      : catalog?.name || 'Ingredient';
  const category = ingredient?.category || catalog?.category || 'pantry';
  const visual = ingredient?.visual || catalog?.visual || {};
  const bgColor =
    visual.color || FALLBACK_COLORS[category] || FALLBACK_COLORS.pantry;
  const iconName =
    visual.icon || FALLBACK_ICONS[category] || FALLBACK_ICONS.pantry;
  const imageUrl =
    typeof visual.imageUrl === 'string' && visual.imageUrl.trim()
      ? visual.imageUrl.trim()
      : null;

  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  const useRealImage = Boolean(showImage && imageUrl && !imgFailed);

  const renderGraphic = (svgClassName) => {
    if (useRealImage) {
      return (
        <img
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      );
    }

    return (
      <svg
        role="img"
        aria-label={name}
        viewBox="0 0 64 64"
        className={svgClassName}
      >
        {renderIngredientSvgShapes(iconName)}
      </svg>
    );
  };

  if (size === 'sm') {
    if (!showImage) {
      return null;
    }

    return (
      <div
        className={`w-10 h-10 rounded-xl border border-[#EADFD2] overflow-hidden flex items-center justify-center shrink-0 ${className}`}
        style={{ backgroundColor: bgColor }}
      >
        {renderGraphic('w-8 h-8')}
      </div>
    );
  }

  // Plain tile mode when "Show ingredient images" is toggled off
  if (!showImage) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={`relative min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-left flex items-center justify-between gap-2 border-2 transition-all cursor-pointer ${
          selected
            ? 'bg-[#EEF7F1] border-[#1F6E42] text-[#14532D] shadow-xs'
            : 'bg-[#FFF9F2] border-[#EADFD2] text-[#2B2B2B] hover:border-[#1F6E42]/60'
        } ${className}`}
      >
        <span className="truncate">{name}</span>
        {selected && (
          <span
            aria-hidden="true"
            className="w-5 h-5 rounded-full bg-[#1F6E42] text-white flex items-center justify-center shrink-0"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative group min-h-[44px] min-w-[44px] w-full p-2 rounded-2xl border-2 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
        selected
          ? 'bg-[#EEF7F1] border-[#1F6E42] shadow-xs'
          : 'bg-white border-[#EADFD2] hover:border-[#1F6E42]/60'
      } ${className}`}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-[#1F6E42] text-white shadow-xs flex items-center justify-center"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        </span>
      )}

      <div
        className="w-[72px] h-[72px] sm:w-24 sm:h-24 rounded-xl border border-black/5 overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-[1.03] motion-reduce:transform-none"
        style={{ backgroundColor: bgColor }}
      >
        {renderGraphic('w-12 h-12 sm:w-16 sm:h-16')}
      </div>

      <span
        className={`text-xs font-medium leading-tight w-full break-words px-0.5 ${
          selected ? 'text-[#14532D] font-semibold' : 'text-[#2B2B2B]'
        }`}
      >
        {name}
      </span>
    </button>
  );
};
