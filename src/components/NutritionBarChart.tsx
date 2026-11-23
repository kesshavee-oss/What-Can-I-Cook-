import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { NutritionInfo } from '../types/cook';
import {
  MACRO_SPECS,
  computeMacroBreakdown,
  formatServingsLabel,
} from '../utils/nutrition';

interface NutritionBarChartProps {
  perPerson: NutritionInfo;
  householdTotal: NutritionInfo;
  householdMultiplier: number;
}

type ChartScope = 'perPerson' | 'household';

function isValidNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val);
}

function formatGrams(val: number | null | undefined): string {
  if (!isValidNumber(val)) return '-';
  const rounded = Math.round(val * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} g`;
}

function formatKcal(val: number | null | undefined): string {
  if (!isValidNumber(val)) return '-';
  return `${Math.round(val)} kcal`;
}

export const NutritionBarChart: React.FC<NutritionBarChartProps> = ({
  perPerson,
  householdTotal,
  householdMultiplier,
}) => {
  const [scope, setScope] = useState<ChartScope>('perPerson');

  const chartStats = useMemo(
    () =>
      computeMacroBreakdown(
        { perPerson, householdTotal, householdMultiplier },
        scope
      ),
    [perPerson, householdTotal, householdMultiplier, scope]
  );

  const caloriesVal = chartStats.calories;

  const svgWidth = 440;
  const labelWidth = 64;
  const valueWidth = 68;
  const plotLeft = labelWidth + 8;
  const plotWidth = svgWidth - plotLeft - valueWidth;
  const rowHeight = 38;
  const topPad = 10;
  const svgHeight = topPad + MACRO_SPECS.length * rowHeight + 28;

  const tickValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    x: plotLeft + ratio * plotWidth,
    label: `${Math.round(chartStats.axisMax * ratio)}g`,
  }));

  const summaryDesc = chartStats.entries
    .map((e) => `${e.label}: ${formatGrams(e.grams)}`)
    .join(', ');

  return (
    <section
      aria-labelledby="nutrition-chart-heading"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3
              className="w-5 h-5 text-[#1F6E42] shrink-0"
              aria-hidden="true"
            />
            <h2
              id="nutrition-chart-heading"
              className="font-heading text-xl font-semibold text-[#2B2B2B]"
            >
              Nutritional breakdown chart
            </h2>
          </div>
          <p className="text-xs font-medium text-[#6B6B6B] mt-0.5">
            Estimated values. Not medical advice.
          </p>
        </div>

        <div
          className="inline-flex items-center p-1 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]"
          role="group"
          aria-label="Nutrition chart serving scope"
        >
          <button
            type="button"
            onClick={() => setScope('perPerson')}
            aria-pressed={scope === 'perPerson'}
            className={`min-h-[44px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              scope === 'perPerson'
                ? 'bg-white text-[#2B2B2B] shadow-xs font-semibold'
                : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            Per serving
          </button>
          <button
            type="button"
            onClick={() => setScope('household')}
            aria-pressed={scope === 'household'}
            className={`min-h-[44px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              scope === 'household'
                ? 'bg-white text-[#2B2B2B] shadow-xs font-semibold'
                : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            Household ({formatServingsLabel(householdMultiplier)})
          </button>
        </div>
      </div>

      {/* Calorie & energy proportion strip */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]">
        <span className="text-xs font-medium text-[#6B6B6B]">
          {scope === 'perPerson'
            ? 'Estimated energy per adult serving'
            : `Estimated energy for ${formatServingsLabel(householdMultiplier)} servings`}
        </span>
        <span className="font-heading font-bold text-base text-[#2B2B2B] tabular-nums">
          {formatKcal(caloriesVal)}{' '}
          <span className="text-xs font-normal text-[#6B6B6B]">Estimated</span>
        </span>
      </div>

      {!chartStats.hasAnyMacro ? (
        <p className="text-sm text-[#6B6B6B] py-4">
          Detailed macronutrient estimates are unavailable for this recipe.
        </p>
      ) : (
        <>
          {/* Bar Chart SVG Visualization */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto block"
              role="img"
              aria-labelledby="nutrition-svg-title nutrition-svg-desc"
            >
              <title id="nutrition-svg-title">
                Macronutrient and fiber bar chart
              </title>
              <desc id="nutrition-svg-desc">
                {`${scope === 'perPerson' ? 'Per adult serving' : 'Household total'}: ${summaryDesc}.`}
              </desc>

              {/* Vertical gridlines */}
              {tickValues.map((tick) => (
                <g key={tick.ratio}>
                  <line
                    x1={tick.x}
                    y1={topPad}
                    x2={tick.x}
                    y2={topPad + MACRO_SPECS.length * rowHeight - 6}
                    stroke="#EADFD2"
                    strokeWidth={tick.ratio === 0 ? '1.5' : '1'}
                    strokeDasharray={tick.ratio === 0 ? undefined : '3 3'}
                  />
                  {(tick.ratio === 0 || tick.ratio === 0.5 || tick.ratio === 1) && (
                    <text
                      x={tick.x}
                      y={topPad + MACRO_SPECS.length * rowHeight + 14}
                      textAnchor={
                        tick.ratio === 0
                          ? 'start'
                          : tick.ratio === 1
                          ? 'end'
                          : 'middle'
                      }
                      fill="#6B6B6B"
                      fontSize="11"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {tick.label}
                    </text>
                  )}
                </g>
              ))}

              {/* Bars */}
              {chartStats.entries.map((entry, idx) => {
                const y = topPad + idx * rowHeight;
                const barY = y + 6;
                const barH = 22;
                const ratio =
                  entry.grams !== null && chartStats.axisMax > 0
                    ? Math.min(1, entry.grams / chartStats.axisMax)
                    : 0;
                const barW =
                  entry.grams !== null && entry.grams > 0
                    ? Math.max(4, ratio * plotWidth)
                    : 0;

                return (
                  <g key={entry.key}>
                    <text
                      x={0}
                      y={barY + 15}
                      fill="#2B2B2B"
                      fontSize="13"
                      fontWeight="600"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {entry.label}
                    </text>

                    <rect
                      x={plotLeft}
                      y={barY}
                      width={plotWidth}
                      height={barH}
                      rx={6}
                      fill="#F3EAE0"
                    />

                    {barW > 0 && (
                      <rect
                        x={plotLeft}
                        y={barY}
                        width={barW}
                        height={barH}
                        rx={6}
                        fill={entry.color}
                      />
                    )}

                    <text
                      x={svgWidth}
                      y={barY + 15}
                      textAnchor="end"
                      fill="#2B2B2B"
                      fontSize="13"
                      fontWeight="600"
                      fontFamily="Inter, system-ui, sans-serif"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatGrams(entry.grams)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 2x2 Accessible Macro Readout Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {chartStats.entries.map((entry) => (
              <div
                key={entry.key}
                className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: entry.color }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold text-[#2B2B2B] truncate">
                      {entry.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#2B2B2B] tabular-nums shrink-0">
                    {formatGrams(entry.grams)}
                  </span>
                </div>

                <div className="text-[11px] text-[#6B6B6B] tabular-nums">
                  {entry.grams === null
                    ? 'Not estimated'
                    : entry.energyPct !== null
                    ? `${entry.energyPct}% of macro kcal · ${entry.pctDaily}% daily ref`
                    : `${entry.pctDaily}% of daily fiber ref`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
