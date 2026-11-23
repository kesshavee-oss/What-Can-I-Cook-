import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  formatInr,
  paiseToEditableRupees,
  parseGroceryQuantity,
  validatePriceInput,
} from '../utils/budgetUtils.js';
import { DEFAULT_PRICES, PRICE_UNITS } from '../utils/priceDefaults.js';
import { Dialog } from './Dialog';

function safeDisplay(value) {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'number' && Number.isNaN(value)) return '-';
  const str = String(value).trim();
  return str.length > 0 ? str : '-';
}

function buildInitialDrafts(items, prices) {
  const drafts = {};
  for (const row of items) {
    const entry = prices?.[row.ingredientId] || DEFAULT_PRICES[row.ingredientId];
    const parsed = parseGroceryQuantity(row.quantityText);
    const defaultUnit = entry?.unit || parsed.unit || 'kg';
    drafts[row.ingredientId] = {
      priceText: entry ? paiseToEditableRupees(entry.perUnitPaise) : '',
      unit: defaultUnit,
      error: null,
    };
  }
  return drafts;
}

/**
 * Modal sheet for editing per-unit rupee prices and units for every item
 * currently in the grocery list, with positive 2-decimal validation and
 * per-item "Reset to defaults" confirmation.
 */
export const PriceEditSheet = ({
  open,
  groceryList,
  prices,
  priceOverrides,
  onSavePrices,
  onResetItemPrice,
  onClose,
}) => {
  const uniqueItems = useMemo(() => {
    const safeList = Array.isArray(groceryList) ? groceryList : [];
    const byId = new Map();
    for (const item of safeList) {
      if (!item?.ingredientId) continue;
      const existing = byId.get(item.ingredientId);
      if (!existing) {
        byId.set(item.ingredientId, {
          ingredientId: item.ingredientId,
          name: safeDisplay(item.name),
          quantityText: safeDisplay(item.quantityText),
        });
      } else if (item.quantityText && item.quantityText !== '-') {
        existing.quantityText =
          existing.quantityText === '-'
            ? item.quantityText
            : `${existing.quantityText}, ${item.quantityText}`;
      }
    }
    return Array.from(byId.values());
  }, [groceryList]);

  const [drafts, setDrafts] = useState({});
  const [confirmResetItem, setConfirmResetItem] = useState(null);

  useEffect(() => {
    if (open) {
      setDrafts(buildInitialDrafts(uniqueItems, prices));
      setConfirmResetItem(null);
    }
  }, [open, uniqueItems, prices]);

  const handlePriceChange = (ingredientId, nextValue) => {
    setDrafts((prev) => {
      const current = prev[ingredientId] || { priceText: '', unit: 'kg', error: null };
      const check = validatePriceInput(nextValue);
      return {
        ...prev,
        [ingredientId]: {
          ...current,
          priceText: nextValue,
          error: check.ok ? null : check.error,
        },
      };
    });
  };

  const handleUnitChange = (ingredientId, nextUnit) => {
    setDrafts((prev) => {
      const current = prev[ingredientId] || { priceText: '', unit: 'kg', error: null };
      return {
        ...prev,
        [ingredientId]: {
          ...current,
          unit: nextUnit,
        },
      };
    });
  };

  const handleConfirmSingleReset = () => {
    if (!confirmResetItem) return;
    const ingId = confirmResetItem.ingredientId;
    const def = DEFAULT_PRICES[ingId];
    if (def) {
      setDrafts((prev) => ({
        ...prev,
        [ingId]: {
          priceText: paiseToEditableRupees(def.perUnitPaise),
          unit: def.unit,
          error: null,
        },
      }));
      onResetItemPrice?.(ingId);
    }
    setConfirmResetItem(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    let hasError = false;
    const validatedDrafts = { ...drafts };
    const nextOverrides = {
      ...(priceOverrides && typeof priceOverrides === 'object' ? priceOverrides : {}),
    };

    for (const item of uniqueItems) {
      const row = drafts[item.ingredientId] || { priceText: '', unit: 'kg', error: null };
      const trimmed = String(row.priceText ?? '').trim();
      const hasDefaultOrPrior = Boolean(
        DEFAULT_PRICES[item.ingredientId] || prices?.[item.ingredientId]
      );

      // Allow leaving an unpriced custom item blank if user didn't enter anything
      if (!trimmed && !hasDefaultOrPrior) {
        continue;
      }

      const check = validatePriceInput(trimmed);
      if (!check.ok) {
        hasError = true;
        validatedDrafts[item.ingredientId] = {
          ...row,
          error: check.error,
        };
        continue;
      }

      const def = DEFAULT_PRICES[item.ingredientId];
      const normalizedUnit = String(row.unit || def?.unit || 'kg').trim();
      if (
        def &&
        check.paise === def.perUnitPaise &&
        normalizedUnit === def.unit
      ) {
        delete nextOverrides[item.ingredientId];
      } else {
        nextOverrides[item.ingredientId] = {
          perUnitPaise: check.paise,
          unit: normalizedUnit,
        };
      }
    }

    setDrafts(validatedDrafts);
    if (hasError) {
      return;
    }

    onSavePrices(nextOverrides);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        title="Edit ingredient prices"
        description="Rough planning estimates in Indian rupees (₹). Changes apply across Grocery and Plan."
        maxWidthClass="max-w-lg"
        onClose={onClose}
      >
        {uniqueItems.length === 0 ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-[#6B6B6B]">
              Your grocery list has no items yet. Add missing ingredients from a recipe or meal plan first.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
              {uniqueItems.map((item) => {
                const row = drafts[item.ingredientId] || {
                  priceText: '',
                  unit: 'kg',
                  error: null,
                };
                const def = DEFAULT_PRICES[item.ingredientId];
                const inputId = `price-input-${item.ingredientId}`;
                const unitId = `price-unit-${item.ingredientId}`;
                const parsed = parseGroceryQuantity(item.quantityText);
                const unitOptions = Array.from(
                  new Set([
                    ...PRICE_UNITS,
                    ...(row.unit ? [row.unit] : []),
                    ...(parsed.unit ? [parsed.unit] : []),
                  ])
                );

                const isDefaultValue = Boolean(
                  def &&
                    row.unit === def.unit &&
                    validatePriceInput(row.priceText).ok &&
                    validatePriceInput(row.priceText).paise === def.perUnitPaise
                );

                return (
                  <div
                    key={item.ingredientId}
                    className="rounded-xl border border-[#EADFD2] bg-[#FFF9F2]/70 p-3.5 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-heading text-sm font-semibold text-[#2B2B2B]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#6B6B6B] tabular-nums">
                          Needed: {item.quantityText}
                          {def
                            ? ` · Default: ${formatInr(def.perUnitPaise)} / ${def.unit}`
                            : ''}
                        </p>
                      </div>

                      {def && (
                        <button
                          type="button"
                          disabled={isDefaultValue}
                          onClick={() =>
                            setConfirmResetItem({
                              ingredientId: item.ingredientId,
                              name: item.name,
                              defaultEntry: def,
                            })
                          }
                          className="min-h-[44px] px-2.5 rounded-lg border border-[#DFD3C5] bg-white hover:border-[#2B2B2B] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reset to defaults</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={inputId}
                        className="block text-xs font-medium text-[#2B2B2B]"
                      >
                        {item.name} price (₹ per {row.unit})
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 min-w-0">
                          <span
                            aria-hidden="true"
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B6B6B]"
                          >
                            ₹
                          </span>
                          <input
                            id={inputId}
                            type="text"
                            inputMode="decimal"
                            value={row.priceText}
                            onChange={(e) =>
                              handlePriceChange(item.ingredientId, e.target.value)
                            }
                            aria-invalid={Boolean(row.error)}
                            aria-describedby={
                              row.error ? `${inputId}-error` : undefined
                            }
                            placeholder="0.00"
                            className={`w-full min-h-[44px] pl-7 pr-3 rounded-xl border bg-white text-sm text-[#2B2B2B] tabular-nums ${
                              row.error
                                ? 'border-[#A63429] focus:outline-[#A63429]'
                                : 'border-[#DFD3C5]'
                            }`}
                          />
                        </div>

                        <select
                          id={unitId}
                          aria-label={`Unit for ${item.name}`}
                          value={row.unit}
                          onChange={(e) =>
                            handleUnitChange(item.ingredientId, e.target.value)
                          }
                          className="min-h-[44px] px-3 rounded-xl border border-[#DFD3C5] bg-white text-sm text-[#2B2B2B] shrink-0"
                        >
                          {unitOptions.map((u) => (
                            <option key={u} value={u}>
                              / {u}
                            </option>
                          ))}
                        </select>
                      </div>

                      {row.error && (
                        <p
                          id={`${inputId}-error`}
                          role="alert"
                          className="text-xs font-medium text-[#A63429]"
                        >
                          {row.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#F3EAE0]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] hover:bg-[#FFF9F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
              >
                Save prices
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Confirm Reset Single Item to Default */}
      <Dialog
        open={Boolean(confirmResetItem)}
        title="Reset item price?"
        description={
          confirmResetItem
            ? `Restore "${confirmResetItem.name}" to the default estimate (${formatInr(
                confirmResetItem.defaultEntry.perUnitPaise
              )} / ${confirmResetItem.defaultEntry.unit})?`
            : undefined
        }
        onClose={() => setConfirmResetItem(null)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmResetItem(null)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSingleReset}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Reset to defaults
          </button>
        </div>
      </Dialog>
    </>
  );
};
