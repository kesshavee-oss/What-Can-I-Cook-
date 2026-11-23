import React, { useEffect, useState } from 'react';
import { VISUAL_PALETTE, getVisualForRecipe } from '../utils/visualUtils.js';

/**
 * Render one of the 8 dish SVG icon groups inside a canonical 160x120 drawing box.
 * Used as an automatic fallback if an image fails to load.
 */
function renderIconShapes(icon, accent, detailColor) {
  switch (icon) {
    case 'bowl':
      return (
        <g>
          <path
            d="M56 34 C53 28, 59 24, 56 18 M80 30 C77 24, 83 20, 80 14 M104 34 C101 28, 107 24, 104 18"
            stroke={accent}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M38 56 H122 C122 86, 104 98, 80 98 C56 98, 38 86, 38 56 Z"
            fill={accent}
          />
          <ellipse cx="80" cy="56" rx="42" ry="9" fill={detailColor} />
          <path
            d="M56 54 Q80 44 104 54"
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="64" y="96" width="32" height="6" rx="3" fill={accent} />
          <circle cx="70" cy="53" r="3" fill={accent} />
          <circle cx="90" cy="52" r="2.5" fill={accent} />
        </g>
      );

    case 'plate':
      return (
        <g>
          <circle cx="80" cy="60" r="42" fill={accent} />
          <circle
            cx="80"
            cy="60"
            r="32"
            fill={detailColor}
            stroke={accent}
            strokeWidth="2.5"
          />
          <ellipse cx="72" cy="56" rx="13" ry="9" fill={accent} opacity="0.9" />
          <ellipse cx="92" cy="65" rx="11" ry="8" fill={accent} opacity="0.75" />
          <circle cx="88" cy="46" r="6" fill={accent} />
          <circle cx="88" cy="46" r="3" fill={detailColor} />
        </g>
      );

    case 'pan':
      return (
        <g>
          <rect
            x="108"
            y="55"
            width="34"
            height="10"
            rx="5"
            fill={accent}
          />
          <circle cx="72" cy="60" r="36" fill={accent} />
          <circle cx="72" cy="60" r="27" fill={detailColor} />
          <ellipse cx="72" cy="60" rx="17" ry="12" fill={accent} opacity="0.88" />
          <circle cx="64" cy="57" r="4" fill={detailColor} />
          <circle cx="81" cy="63" r="3" fill={detailColor} />
        </g>
      );

    case 'pot':
      return (
        <g>
          <path
            d="M66 26 C63 21, 69 17, 66 12 M94 26 C91 21, 97 17, 94 12"
            stroke={accent}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <rect x="34" y="54" width="12" height="9" rx="4" fill={accent} />
          <rect x="114" y="54" width="12" height="9" rx="4" fill={accent} />
          <path
            d="M44 50 H116 V82 C116 92, 108 98, 98 98 H62 C52 98, 44 92, 44 82 Z"
            fill={accent}
          />
          <path d="M42 46 Q80 30 118 46 Z" fill={accent} />
          <circle cx="80" cy="34" r="5" fill={accent} />
          <line
            x1="54"
            y1="56"
            x2="106"
            y2="56"
            stroke={detailColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );

    case 'wrap':
      return (
        <g transform="rotate(-20 80 60)">
          <rect x="40" y="42" width="80" height="36" rx="18" fill={accent} />
          <rect x="46" y="47" width="68" height="26" rx="13" fill={detailColor} />
          <path
            d="M52 60 Q64 50 76 60 T100 60 T112 60"
            fill="none"
            stroke={accent}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="74" y="42" width="14" height="36" rx="3" fill={accent} opacity="0.85" />
        </g>
      );

    case 'cup':
      return (
        <g>
          <path
            d="M68 28 C65 22, 71 18, 68 13 M90 28 C87 22, 93 18, 90 13"
            stroke={accent}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M108 54 H116 C124 54, 128 60, 128 68 C128 76, 122 82, 114 82 H106"
            fill="none"
            stroke={accent}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M48 44 H110 L103 86 C101 94, 94 98, 86 98 H72 C64 98, 57 94, 55 86 Z"
            fill={accent}
          />
          <ellipse cx="79" cy="44" rx="31" ry="7" fill={detailColor} />
          <circle cx="72" cy="44" r="3" fill={accent} />
          <circle cx="86" cy="43" r="2.5" fill={accent} />
        </g>
      );

    case 'skewer':
      return (
        <g>
          <line
            x1="34"
            y1="92"
            x2="126"
            y2="28"
            stroke={accent}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <rect
            x="48"
            y="62"
            width="18"
            height="18"
            rx="5"
            transform="rotate(-35 57 71)"
            fill={accent}
          />
          <circle cx="79" cy="58" r="10" fill={detailColor} stroke={accent} strokeWidth="3" />
          <rect
            x="92"
            y="34"
            width="18"
            height="18"
            rx="5"
            transform="rotate(-35 101 43)"
            fill={accent}
          />
          <circle cx="57" cy="71" r="3" fill={detailColor} />
          <circle cx="101" cy="43" r="3" fill={detailColor} />
        </g>
      );

    case 'leaf':
    default:
      return (
        <g>
          <path
            d="M46 88 C44 50, 74 26, 114 28 C116 68, 92 94, 54 92 Z"
            fill={accent}
          />
          <path
            d="M40 94 C58 76, 80 58, 102 40"
            stroke={detailColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M72 64 L68 48 M84 54 L98 58"
            stroke={detailColor}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="48" cy="44" r="5" fill={accent} opacity="0.65" />
          <circle cx="110" cy="84" r="4.5" fill={accent} opacity="0.65" />
        </g>
      );
  }
}

/**
 * Renders an optional owned local dish photograph (/public/photos/<id>.jpg via photoPath)
 * with explicit dimensions & lazy loading, falling back automatically to a crisp SVG illustration.
 */
export const RecipeVisual = React.memo(function RecipeVisual({
  recipe,
  variant = 'card',
  showVisual = true,
  className = '',
}) {
  const visual = getVisualForRecipe(recipe);
  const imageSrc =
    (typeof recipe?.imageUrl === 'string' && recipe.imageUrl.trim()) ||
    visual.photoPath ||
    '';
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageSrc]);

  const diet = recipe?.diet === 'nonveg' ? 'nonveg' : 'veg';
  const recipeName =
    typeof recipe?.name === 'string' && recipe.name.trim().length > 0
      ? recipe.name.trim()
      : 'Recipe';
  const dietWords = diet === 'veg' ? 'vegetarian' : 'non-vegetarian';
  const isAi = Boolean(recipe?.isAiGenerated || recipe?.source === 'ai');
  const ariaLabel = `${recipeName}, ${dietWords}${isAi ? ', AI-generated' : ''}`;

  const isDetail = variant === 'detail';
  const isSquare = variant === 'square';

  const containerDimensions = isSquare
    ? 'w-12 h-12 shrink-0 rounded-xl'
    : isDetail
    ? 'aspect-video w-full'
    : 'aspect-[4/3] w-full';

  const svgWidth = isSquare ? 48 : 160;
  const svgHeight = isSquare ? 48 : isDetail ? 90 : 120;
  const viewBox = `0 0 ${svgWidth} ${svgHeight}`;
  const photoWidth = isSquare ? 192 : 1200;
  const photoHeight = isSquare ? 192 : isDetail ? 675 : 900;

  const detailColor =
    visual.color === VISUAL_PALETTE.cream ? '#FFFFFF' : VISUAL_PALETTE.cream;
  const decoColor =
    visual.color === VISUAL_PALETTE.cream ? visual.accent : '#FFFFFF';
  const decoOpacity = visual.color === VISUAL_PALETTE.cream ? 0.1 : 0.2;

  const iconGroupTransform = isSquare
    ? 'translate(0, 6) scale(0.3)'
    : isDetail
    ? 'translate(20, 0) scale(0.75)'
    : undefined;

  const badgeSize = isSquare ? 12 : 18;
  const badgeX = svgWidth - badgeSize - (isSquare ? 3 : 8);
  const badgeY = svgHeight - badgeSize - (isSquare ? 3 : 8);
  const badgeRadius = isSquare ? 3 : 5;
  const markColor =
    diet === 'veg' ? VISUAL_PALETTE.herbGreen : VISUAL_PALETTE.tomato;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`relative overflow-hidden select-none ${containerDimensions} ${className}`}
      style={{ backgroundColor: visual.color }}
    >
      {showVisual && (
        <>
          {!imgFailed && imageSrc ? (
            <>
              <img
                src={imageSrc}
                alt=""
                aria-hidden="true"
                width={photoWidth}
                height={photoHeight}
                loading="lazy"
                decoding="async"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover block"
              />
              {/* Subtle corner diet indicator matching Indian veg/non-veg symbol */}
              <span
                aria-hidden="true"
                className={`absolute bg-white/95 shadow-xs flex items-center justify-center ${
                  isSquare
                    ? 'bottom-0.5 right-0.5 w-3 h-3 rounded-[3px] border-[1.2px]'
                    : 'bottom-2 right-2 w-[18px] h-[18px] rounded-[5px] border-[1.6px]'
                }`}
                style={{ borderColor: markColor }}
              >
                <span
                  className={
                    diet === 'veg'
                      ? isSquare
                        ? 'w-1.5 h-1.5 rounded-full'
                        : 'w-2 h-2 rounded-full'
                      : isSquare
                      ? 'w-[5px] h-[5px] rounded-[1px]'
                      : 'w-2 h-2 rounded-[1px]'
                  }
                  style={{ backgroundColor: markColor }}
                />
              </span>
            </>
          ) : (
            <svg
              width={svgWidth}
              height={svgHeight}
              viewBox={viewBox}
              fill="none"
              aria-hidden="true"
              className="w-full h-full block"
            >
              <rect width={svgWidth} height={svgHeight} fill={visual.color} />
              <circle
                cx={svgWidth * 0.2}
                cy={svgHeight * 0.24}
                r={svgHeight * 0.22}
                fill={decoColor}
                fillOpacity={decoOpacity}
              />
              <circle
                cx={svgWidth * 0.84}
                cy={svgHeight * 0.72}
                r={svgHeight * 0.26}
                fill={decoColor}
                fillOpacity={decoOpacity}
              />

              <g transform={iconGroupTransform}>
                {renderIconShapes(visual.icon, visual.accent, detailColor)}
              </g>

              <rect
                x={badgeX}
                y={badgeY}
                width={badgeSize}
                height={badgeSize}
                rx={badgeRadius}
                fill="#FFFFFF"
                stroke={markColor}
                strokeWidth={isSquare ? 1.2 : 1.6}
              />
              {diet === 'veg' ? (
                <circle
                  cx={badgeX + badgeSize / 2}
                  cy={badgeY + badgeSize / 2}
                  r={isSquare ? 2.6 : 4}
                  fill={markColor}
                />
              ) : (
                <rect
                  x={badgeX + (badgeSize - (isSquare ? 5 : 8)) / 2}
                  y={badgeY + (badgeSize - (isSquare ? 5 : 8)) / 2}
                  width={isSquare ? 5 : 8}
                  height={isSquare ? 5 : 8}
                  rx={1}
                  fill={markColor}
                />
              )}
            </svg>
          )}

          {isAi && (
            <span
              aria-hidden="true"
              className={`absolute bg-[#6B3FA0] text-white font-semibold tracking-wide rounded-md shadow-xs ${
                isSquare
                  ? 'top-0.5 left-0.5 px-1 py-0 text-[9px] leading-tight'
                  : 'top-2.5 left-2.5 px-2 py-0.5 text-[11px]'
              }`}
            >
              AI
            </span>
          )}
        </>
      )}
    </div>
  );
});
