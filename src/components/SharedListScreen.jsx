import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, CopyPlus, ExternalLink, ShoppingBasket } from 'lucide-react';
import { sortAndGroupGroceryItems } from '../utils/groceryUtils.js';
import { decodeSharedGroceryFragment } from '../utils/shareUtils.js';
import { Dialog } from './Dialog';

/**
 * Read-only recipient view when the app is opened with a "#list=" URL fragment.
 * Checkboxes operate strictly in local state on the recipient's phone.
 * Nothing is saved to localStorage unless the user explicitly taps "Save a copy" and confirms.
 */
export const SharedListScreen = ({
  hashFragment,
  onOpenApp,
  onSaveCopy,
}) => {
  const decoded = useMemo(
    () => decodeSharedGroceryFragment(hashFragment),
    [hashFragment]
  );

  const [localItems, setLocalItems] = useState(() =>
    decoded.ok ? decoded.items : []
  );
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    setLocalItems(decoded.ok ? decoded.items : []);
  }, [decoded]);

  const grouped = useMemo(() => {
    const view = sortAndGroupGroceryItems(localItems, {
      sortBy: 'aisle',
      selectedCategory: 'all',
    });
    return view.groups;
  }, [localItems]);

  const totalCount = localItems.length;
  const checkedCount = localItems.filter((item) => Boolean(item.checked)).length;

  const handleToggleLocalItem = (itemId) => {
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleConfirmSaveCopy = () => {
    setConfirmSaveOpen(false);
    const itemsToSave = localItems.map((item, idx) => ({
      id: `copied_${Date.now()}_${idx}`,
      name: item.name,
      ingredientId: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `item_${idx}`,
      category: item.category,
      quantityText: item.quantityText || '',
      checked: Boolean(item.checked),
      fromRecipeIds: [],
    }));
    onSaveCopy?.(itemsToSave);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#2B2B2B] px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-[720px] mx-auto space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#C5411B] text-white flex items-center justify-center shrink-0">
              <ShoppingBasket className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B] leading-tight">
                Shared grocery list
              </h1>
              {decoded.ok && (
                <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 tabular-nums">
                  Read-only · {totalCount} {totalCount === 1 ? 'item' : 'items'} ·{' '}
                  {checkedCount} checked on this phone
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenApp}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            <span>Open the app</span>
          </button>
        </header>

        {!decoded.ok ? (
          <section
            role="alert"
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EADFD2] text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#A63429]/10 text-[#A63429] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-[#2B2B2B]">
                Unable to open shared list
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                {decoded.error}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenApp}
              className="min-h-[44px] px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span>Open the app</span>
            </button>
          </section>
        ) : (
          <>
            <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                Checking items here stays on your phone only and does not change the
                sender&apos;s list.
              </p>

              <button
                type="button"
                onClick={() => setConfirmSaveOpen(true)}
                className="min-h-[44px] px-4 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <CopyPlus className="w-4 h-4" aria-hidden="true" />
                <span>Save a copy</span>
              </button>
            </section>

            <div className="space-y-4">
              {grouped.map((group) => (
                <section
                  key={group.id}
                  aria-label={group.label}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F3EAE0]">
                    <h2 className="font-heading text-base font-semibold text-[#2B2B2B]">
                      {group.label}
                    </h2>
                    <span className="text-xs text-[#6B6B6B] tabular-nums">
                      {group.items.length}{' '}
                      {group.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <ul className="divide-y divide-[#F3EAE0]">
                    {group.items.map((item) => {
                      const isChecked = Boolean(item.checked);
                      const checkboxId = `shared-item-${item.id}`;
                      return (
                        <li
                          key={item.id}
                          onClick={() => handleToggleLocalItem(item.id)}
                          className="py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="relative flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2">
                              <input
                                id={checkboxId}
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleLocalItem(item.id)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Mark ${item.name} as ${
                                  isChecked ? 'not bought' : 'bought'
                                }`}
                                className="peer sr-only"
                              />
                              <span
                                aria-hidden="true"
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-[#1F6E42] border-[#1F6E42] text-white'
                                    : 'border-[#CFC6BB] bg-white'
                                }`}
                              >
                                {isChecked && (
                                  <Check className="w-4 h-4" strokeWidth={3} />
                                )}
                              </span>
                            </span>

                            <label
                              htmlFor={checkboxId}
                              onClick={(e) => e.preventDefault()}
                              className="min-w-0 flex-1 cursor-pointer"
                            >
                              <span
                                className={`block text-sm sm:text-base font-medium leading-snug break-words ${
                                  isChecked
                                    ? 'line-through text-[#6B6B6B]'
                                    : 'text-[#2B2B2B]'
                                }`}
                              >
                                {item.name}
                              </span>
                              {item.quantityText && (
                                <span className="block text-xs text-[#6B6B6B] tabular-nums mt-0.5">
                                  {item.quantityText}
                                </span>
                              )}
                            </label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={confirmSaveOpen}
        title="Save a copy to your grocery list?"
        description={`This will save these ${totalCount} ${
          totalCount === 1 ? 'item' : 'items'
        } into your own Grocery list and open the app.`}
        onClose={() => setConfirmSaveOpen(false)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmSaveOpen(false)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSaveCopy}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Save a copy
          </button>
        </div>
      </Dialog>
    </div>
  );
};
