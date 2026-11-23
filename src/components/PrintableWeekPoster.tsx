import React from 'react';
import { Check } from 'lucide-react';
import { GroceryItem, MealType } from '../types/cook';
import { PLAN_MEAL_TYPES, PrintableWeekDay } from '../utils/planUtils.js';

export type PrintWeekLayout = 'landscape_grid' | 'portrait_agenda';

export interface PrintableWeekPosterProps {
  weekHeading: string;
  days: PrintableWeekDay[];
  totalMealCount: number;
  servingsLabel: string;
  layout: PrintWeekLayout;
  showTimesAndServings: boolean;
  includeGroceries: boolean;
  includeNotes: boolean;
  missingItems: GroceryItem[];
  todayIso?: string;
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

/**
 * Printer-friendly weekly schedule designed for posting on a kitchen wall or fridge.
 * Renders either a 7-day landscape matrix or a 2-column portrait daily agenda,
 * with pen checkboxes, optional missing groceries checklist, and prep notes lines.
 */
export const PrintableWeekPoster: React.FC<PrintableWeekPosterProps> = ({
  weekHeading,
  days,
  totalMealCount,
  servingsLabel,
  layout,
  showTimesAndServings,
  includeGroceries,
  includeNotes,
  missingItems,
  todayIso,
}) => {
  const safeMissing = Array.isArray(missingItems) ? missingItems : [];
  const visibleMissing = safeMissing.slice(0, 24);
  const extraMissingCount = Math.max(0, safeMissing.length - visibleMissing.length);

  return (
    <div className="bg-white text-[#111111] space-y-3">
      {/* Poster Header */}
      <header className="flex flex-wrap items-end justify-between gap-2 pb-2 border-b-2 border-[#2B2B2B]">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-[#6B6B6B] uppercase">
            Kitchen Wall Menu
          </p>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-[#111111] leading-tight">
            Weekly Meal Plan · {weekHeading}
          </h2>
        </div>

        <div className="text-right text-xs text-[#2B2B2B] tabular-nums space-x-2">
          <span>
            {totalMealCount} {totalMealCount === 1 ? 'meal' : 'meals'} planned
          </span>
          <span aria-hidden="true">·</span>
          <span>{servingsLabel} servings/meal</span>
        </div>
      </header>

      {layout === 'landscape_grid' ? (
        /* 7-day x 4-meal landscape wall calendar */
        <div className="overflow-x-auto">
          <table
            aria-label={`Printable weekly schedule for ${weekHeading}`}
            className="w-full min-w-[680px] print:min-w-0 table-fixed border-collapse border border-[#2B2B2B] text-left"
          >
            <thead>
              <tr className="bg-[#FFF9F2] print:bg-[#F5F5F5]">
                <th
                  scope="col"
                  className="w-[10%] border border-[#2B2B2B] px-2 py-1.5 text-[11px] font-heading font-bold uppercase tracking-wide text-[#2B2B2B]"
                >
                  Meal
                </th>
                {days.map((day) => {
                  const isToday = Boolean(todayIso && day.iso === todayIso);
                  return (
                    <th
                      key={day.iso}
                      scope="col"
                      className={`w-[12.85%] border border-[#2B2B2B] px-2 py-1.5 text-center ${
                        isToday ? 'bg-[#F5EDE4]' : ''
                      }`}
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#555555]">
                        {day.shortDay}
                      </span>
                      <span className="block font-heading text-sm font-bold text-[#111111] tabular-nums">
                        {day.dayNumber}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {PLAN_MEAL_TYPES.map((mealType) => (
                <tr key={mealType}>
                  <th
                    scope="row"
                    className="border border-[#2B2B2B] bg-[#FFF9F2]/70 px-2 py-2 align-top font-heading text-xs font-bold text-[#111111]"
                  >
                    {MEAL_LABELS[mealType]}
                  </th>
                  {days.map((day) => {
                    const items = day.slots[mealType] || [];
                    return (
                      <td
                        key={`${day.iso}-${mealType}`}
                        className="border border-[#2B2B2B] px-1.5 py-1.5 align-top min-h-[62px]"
                      >
                        {items.length === 0 ? (
                          <div
                            aria-label={`No ${MEAL_LABELS[mealType]} planned for ${day.shortDay} ${day.dayNumber}`}
                            className="h-10 flex items-end"
                          >
                            <span className="w-full border-b border-dotted border-[#CFC6BB]" />
                          </div>
                        ) : (
                          <ul className="space-y-1.5">
                            {items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-start gap-1.5 leading-snug"
                              >
                                <span
                                  aria-hidden="true"
                                  className={`mt-0.5 w-3 h-3 rounded-[2px] border border-[#2B2B2B] shrink-0 inline-flex items-center justify-center ${
                                    item.isCooked ? 'bg-[#1F6E42] text-white border-[#1F6E42]' : 'bg-white'
                                  }`}
                                >
                                  {item.isCooked && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`block text-[11px] font-semibold leading-tight break-words ${
                                      item.isSkipped
                                        ? 'line-through text-[#6B6B6B]'
                                        : 'text-[#111111]'
                                    }`}
                                  >
                                    {item.name}
                                  </span>

                                  <span className="block text-[9.5px] text-[#555555] tabular-nums mt-0.5">
                                    {item.diet === 'nonveg' ? 'Non-veg' : 'Veg'}
                                    {showTimesAndServings && item.totalMinutes !== null
                                      ? ` · ${item.totalMinutes}m`
                                      : ''}
                                    {showTimesAndServings
                                      ? ` · ${item.servingsText} serv.`
                                      : ''}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 2-column vertical daily agenda for portrait paper */
        <div
          aria-label={`Printable daily agenda for ${weekHeading}`}
          className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5"
        >
          {days.map((day) => {
            const isToday = Boolean(todayIso && day.iso === todayIso);
            return (
              <section
                key={day.iso}
                className="border border-[#2B2B2B] rounded-lg p-2.5 space-y-1.5 break-inside-avoid"
              >
                <div className="flex items-center justify-between border-b border-[#D6CEC4] pb-1">
                  <h3 className="font-heading text-xs font-bold text-[#111111]">
                    {day.fullLabel}
                  </h3>
                  {isToday && (
                    <span className="text-[10px] font-semibold text-[#B83915]">
                      Today
                    </span>
                  )}
                </div>

                <dl className="space-y-1 text-[11px]">
                  {PLAN_MEAL_TYPES.map((mealType) => {
                    const items = day.slots[mealType] || [];
                    return (
                      <div key={mealType} className="flex items-baseline gap-2">
                        <dt className="w-16 shrink-0 font-semibold text-[#555555]">
                          {MEAL_LABELS[mealType]}
                        </dt>
                        <dd className="min-w-0 flex-1 text-[#111111]">
                          {items.length === 0 ? (
                            <span className="inline-block w-full border-b border-dotted border-[#CFC6BB] h-3" />
                          ) : (
                            <ul className="space-y-0.5">
                              {items.map((item) => (
                                <li
                                  key={item.id}
                                  className="flex items-start gap-1.5 leading-snug"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`mt-0.5 w-3 h-3 rounded-[2px] border border-[#2B2B2B] shrink-0 inline-flex items-center justify-center ${
                                      item.isCooked
                                        ? 'bg-[#1F6E42] text-white border-[#1F6E42]'
                                        : 'bg-white'
                                    }`}
                                  >
                                    {item.isCooked && (
                                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                    )}
                                  </span>
                                  <span
                                    className={
                                      item.isSkipped
                                        ? 'line-through text-[#6B6B6B]'
                                        : 'font-medium text-[#111111]'
                                    }
                                  >
                                    {item.name}
                                    {showTimesAndServings && item.totalMinutes !== null
                                      ? ` (${item.totalMinutes}m)`
                                      : ''}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            );
          })}
        </div>
      )}

      {/* Optional Footer Strips for Fridge / Kitchen Wall */}
      {(includeGroceries || includeNotes) && (
        <div
          className={`grid gap-3 pt-1 ${
            includeGroceries && includeNotes
              ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {includeGroceries && (
            <section
              aria-label="Missing groceries checklist"
              className="border border-[#2B2B2B] rounded-lg p-2.5 space-y-1.5 break-inside-avoid"
            >
              <div className="flex items-center justify-between border-b border-[#D6CEC4] pb-1">
                <h3 className="font-heading text-xs font-bold text-[#111111]">
                  Items to Buy This Week
                </h3>
                <span className="text-[10px] text-[#555555] tabular-nums">
                  {safeMissing.length}{' '}
                  {safeMissing.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {visibleMissing.length === 0 ? (
                <p className="text-[11px] text-[#555555]">
                  All ingredients for planned meals are covered in your pantry.
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px]">
                  {visibleMissing.map((item) => (
                    <li key={item.id} className="flex items-start gap-1.5 min-w-0">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 w-2.5 h-2.5 rounded-[2px] border border-[#2B2B2B] shrink-0 bg-white"
                      />
                      <span className="truncate text-[#111111]">
                        {item.name}
                        {item.quantityText ? ` (${item.quantityText})` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {extraMissingCount > 0 && (
                <p className="text-[10px] text-[#555555] tabular-nums">
                  +{extraMissingCount} more in the Grocery tab
                </p>
              )}
            </section>
          )}

          {includeNotes && (
            <section
              aria-label="Prep and kitchen notes"
              className="border border-[#2B2B2B] rounded-lg p-2.5 space-y-2 break-inside-avoid"
            >
              <h3 className="font-heading text-xs font-bold text-[#111111] border-b border-[#D6CEC4] pb-1">
                Prep &amp; Kitchen Notes (Soak / Marinate / Leftovers)
              </h3>
              <div className="space-y-3.5 pt-1" aria-hidden="true">
                <div className="border-b border-[#CFC6BB]" />
                <div className="border-b border-[#CFC6BB]" />
                <div className="border-b border-[#CFC6BB]" />
              </div>
            </section>
          )}
        </div>
      )}

      <p className="text-[10px] text-[#555555] text-right">
        Check boxes mark cooked dishes · What Can I Cook?
      </p>
    </div>
  );
};
