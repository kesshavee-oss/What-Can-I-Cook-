import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChefHat,
  Copy,
  IndianRupee,
  Mail,
  Pencil,
  Printer,
  QrCode,
  Share2,
  ShoppingBasket,
  Trash2,
} from 'lucide-react';
import { RECIPES, getIngredientById } from '../recipes.js';
import { estimateListCost, formatInr } from '../utils/budgetUtils.js';
import {
  GROCERY_AISLE_ORDER,
  GROCERY_SORT_OPTIONS,
  getCategoryLabel,
  sortAndGroupGroceryItems,
  toPlainText,
} from '../utils/groceryUtils.js';
import {
  MAX_SHARED_ITEMS,
  SHARED_LIST_TOO_LONG_ERROR,
  buildShareGroceryMailtoUrl,
  buildShareGroceryUrl,
  generateSharedGroceryQrDataUrl,
} from '../utils/shareUtils.js';
import { DEFAULT_PRICES } from '../utils/priceDefaults.js';
import { Dialog } from './Dialog';
import { IngredientTile } from './IngredientTile.jsx';
import { PriceEditSheet } from './PriceEditSheet.jsx';
import { Toast } from './Toast';

const GROCERY_SORT_STORAGE_KEY = 'wcic_grocery_sort';
const GROUPED_SORT_IDS = new Set(['aisle', 'category_az', 'category_count']);
const VALID_SORT_IDS = new Set(GROCERY_SORT_OPTIONS.map((opt) => opt.id));

function loadSavedGrocerySort() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'aisle';
    const raw = window.localStorage.getItem(GROCERY_SORT_STORAGE_KEY);
    if (raw && VALID_SORT_IDS.has(raw)) {
      return raw;
    }
    return 'aisle';
  } catch {
    return 'aisle';
  }
}

function saveGrocerySort(nextSort) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (VALID_SORT_IDS.has(nextSort)) {
      window.localStorage.setItem(GROCERY_SORT_STORAGE_KEY, nextSort);
    }
  } catch {
    // Ignore storage write errors cleanly
  }
}

function safeDisplay(value) {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'number' && Number.isNaN(value)) return '-';
  const str = String(value).trim();
  return str.length > 0 ? str : '-';
}

/**
 * Grocery List screen: displays shopping budget estimate above missing ingredients
 * grouped by category, supports checking items off, editing prices, copying plain text,
 * printing, and clearing items.
 */
export const GroceryScreen = ({
  groceryList,
  prices = DEFAULT_PRICES,
  priceOverrides = {},
  aiRecipes = [],
  showCost = true,
  showIngredientImages = true,
  initialOpenPriceEdit = false,
  onInitialPriceEditHandled,
  storageUnavailable,
  onToggleChecked,
  onRemoveItem,
  onClearChecked,
  onClearAll,
  onSavePrices,
  onResetItemPrice,
  onGoToCook,
}) => {
  const [confirmClearCheckedOpen, setConfirmClearCheckedOpen] = useState(false);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [exportModalText, setExportModalText] = useState(null);
  const [shareFallbackUrl, setShareFallbackUrl] = useState(null);
  const [shareFallbackQrUrl, setShareFallbackQrUrl] = useState('');
  const [shareQrModal, setShareQrModal] = useState(null);
  const [inlineQrDataUrl, setInlineQrDataUrl] = useState('');
  const [toast, setToast] = useState(null);
  const [sortBy, setSortBy] = useState(() => loadSavedGrocerySort());
  const lastGroupedSortRef = useRef(
    GROUPED_SORT_IDS.has(loadSavedGrocerySort()) ? loadSavedGrocerySort() : 'aisle'
  );
  const lastFlatSortRef = useRef(
    !GROUPED_SORT_IDS.has(loadSavedGrocerySort()) ? loadSavedGrocerySort() : 'added_order'
  );
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryOrder, setCategoryOrder] = useState(() => [...GROCERY_AISLE_ORDER]);

  const safeList = Array.isArray(groceryList) ? groceryList : [];
  const isSortByCategory = GROUPED_SORT_IDS.has(sortBy);

  const handleSelectSortBy = (nextSort) => {
    if (!VALID_SORT_IDS.has(nextSort)) return;
    if (GROUPED_SORT_IDS.has(nextSort)) {
      lastGroupedSortRef.current = nextSort;
    } else {
      lastFlatSortRef.current = nextSort;
    }
    setSortBy(nextSort);
    saveGrocerySort(nextSort);
  };

  const handleToggleSortByCategory = () => {
    if (isSortByCategory) {
      const nextFlat = lastFlatSortRef.current || 'added_order';
      setSortBy(nextFlat);
      saveGrocerySort(nextFlat);
    } else {
      const nextGrouped = lastGroupedSortRef.current || 'aisle';
      setSortBy(nextGrouped);
      saveGrocerySort(nextGrouped);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (safeList.length === 0 || safeList.length > MAX_SHARED_ITEMS) {
      setInlineQrDataUrl('');
      return () => {
        cancelled = true;
      };
    }

    const res = buildShareGroceryUrl(safeList);
    if (!res.ok || !res.url) {
      setInlineQrDataUrl('');
      return () => {
        cancelled = true;
      };
    }

    void generateSharedGroceryQrDataUrl(res.url).then((qrRes) => {
      if (!cancelled) {
        setInlineQrDataUrl(qrRes.ok ? qrRes.dataUrl : '');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [safeList]);

  useEffect(() => {
    if (initialOpenPriceEdit) {
      setPriceSheetOpen(true);
      onInitialPriceEditHandled?.();
    }
  }, [initialOpenPriceEdit, onInitialPriceEditHandled]);

  const recipeNameMap = useMemo(() => {
    const map = new Map(RECIPES.map((r) => [r.id, r.name]));
    if (Array.isArray(aiRecipes)) {
      for (const r of aiRecipes) {
        if (r?.id && r?.name) map.set(r.id, r.name);
      }
    }
    return map;
  }, [aiRecipes]);

  const sortedView = useMemo(
    () =>
      sortAndGroupGroceryItems(safeList, {
        sortBy,
        selectedCategory,
        categoryOrder,
      }),
    [safeList, sortBy, selectedCategory, categoryOrder]
  );

  const grouped = sortedView.groups;
  const availableCategories = sortedView.availableCategories;

  useEffect(() => {
    if (
      selectedCategory !== 'all' &&
      !availableCategories.some((cat) => cat.id === selectedCategory)
    ) {
      setSelectedCategory('all');
    }
  }, [availableCategories, selectedCategory]);

  const handleMoveCategory = (categoryId, direction) => {
    setCategoryOrder((prev) => {
      const visibleIds = availableCategories.map((c) => c.id);
      const visibleIdx = visibleIds.indexOf(categoryId);
      const targetVisibleIdx = visibleIdx + direction;
      if (
        visibleIdx === -1 ||
        targetVisibleIdx < 0 ||
        targetVisibleIdx >= visibleIds.length
      ) {
        return prev;
      }
      const neighborId = visibleIds[targetVisibleIdx];
      const next = [...prev];
      const idxA = next.indexOf(categoryId);
      const idxB = next.indexOf(neighborId);
      if (idxA === -1 || idxB === -1) return prev;
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      return next;
    });
  };

  const costSummary = useMemo(
    () => estimateListCost(safeList, prices),
    [safeList, prices]
  );

  const lineCostById = useMemo(
    () => new Map(costSummary.lines.map((line) => [line.id, line.paise])),
    [costSummary]
  );

  const totalCount = safeList.length;
  const checkedCount = safeList.filter((i) => Boolean(i.checked)).length;

  const totalCostText =
    costSummary.knownCount > 0 ? formatInr(costSummary.totalPaise) : '-';
  const leftToBuyText =
    costSummary.knownCount > 0 ? formatInr(costSummary.leftToBuyPaise) : '-';

  const budgetScreenReaderSentence = useMemo(() => {
    if (totalCount === 0) return '';
    const basePart =
      costSummary.knownCount > 0
        ? `Estimated total: ${totalCostText} for ${costSummary.knownCount} ${
            costSummary.knownCount === 1 ? 'item' : 'items'
          }, left to buy ${leftToBuyText}`
        : 'Estimated total is not available yet';
    const unknownPart =
      costSummary.unknownCount > 0
        ? `, and ${costSummary.unknownCount} ${
            costSummary.unknownCount === 1 ? 'item has' : 'items have'
          } no price estimate`
        : '';
    return `${basePart}${unknownPart}. Estimate. Prices may differ in your market.`;
  }, [totalCount, costSummary, totalCostText, leftToBuyText]);

  const handleExportList = async () => {
    const plain = toPlainText(safeList, {
      showCost,
      prices,
      sortBy,
      selectedCategory,
      categoryOrder,
    });
    if (!plain) return;

    let copied = false;
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(plain);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = plain;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      setToast({
        variant: 'success',
        message: 'Grocery list exported to clipboard.',
      });
    } else {
      setExportModalText(plain);
    }
  };

  const mailtoShare = useMemo(
    () =>
      buildShareGroceryMailtoUrl(safeList, {
        sortBy,
        categoryOrder,
      }),
    [safeList, sortBy, categoryOrder]
  );

  const copyTextWithFallback = async (text) => {
    let copied = false;
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    return copied;
  };

  const handleShareList = async () => {
    if (safeList.length > MAX_SHARED_ITEMS) {
      setToast({
        variant: 'error',
        message: SHARED_LIST_TOO_LONG_ERROR,
      });
      return;
    }

    const res = buildShareGroceryUrl(safeList);
    if (!res.ok || !res.url) {
      setToast({
        variant: 'error',
        message: res.error || SHARED_LIST_TOO_LONG_ERROR,
      });
      return;
    }

    const shareUrl = res.url;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Shared grocery list',
          text: 'Read-only grocery list from What Can I Cook?',
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err && typeof err === 'object' && err.name === 'AbortError') {
          return;
        }
        // Fall through to clipboard copy if native share failed unexpectedly
      }
    }

    const copied = await copyTextWithFallback(shareUrl);

    if (copied) {
      setToast({
        variant: 'success',
        message: 'Share link copied to clipboard.',
      });
    } else {
      const qrRes = await generateSharedGroceryQrDataUrl(shareUrl);
      setShareFallbackQrUrl(qrRes.ok ? qrRes.dataUrl : '');
      setShareFallbackUrl(shareUrl);
    }
  };

  const handleOpenShareQr = async () => {
    if (safeList.length > MAX_SHARED_ITEMS) {
      setToast({
        variant: 'error',
        message: SHARED_LIST_TOO_LONG_ERROR,
      });
      return;
    }

    const res = buildShareGroceryUrl(safeList);
    if (!res.ok || !res.url) {
      setToast({
        variant: 'error',
        message: res.error || SHARED_LIST_TOO_LONG_ERROR,
      });
      return;
    }

    const qrRes = await generateSharedGroceryQrDataUrl(res.url);
    setShareQrModal({
      url: res.url,
      itemCount: res.itemCount || safeList.length,
      qrDataUrl: qrRes.ok ? qrRes.dataUrl : '',
      qrError: qrRes.ok ? null : qrRes.error,
    });
  };

  const handleCopyShareUrlFromQr = async () => {
    if (!shareQrModal?.url) return;
    const copied = await copyTextWithFallback(shareQrModal.url);
    if (copied) {
      setToast({
        variant: 'success',
        message: 'Share link copied to clipboard.',
      });
    } else {
      const urlToShow = shareQrModal.url;
      const qrToShow = shareQrModal.qrDataUrl || '';
      setShareQrModal(null);
      setShareFallbackQrUrl(qrToShow);
      setShareFallbackUrl(urlToShow);
    }
  };

  const handleRowKeyDown = (e, item) => {
    // Let native interactive children (checkbox, remove button) handle their own clicks
    const targetTag = e.target?.tagName?.toLowerCase();
    if (e.key === ' ' && targetTag !== 'input' && targetTag !== 'button') {
      e.preventDefault();
      onToggleChecked(item.id);
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      setPendingDeleteItem(item);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto space-y-5 pb-36 sm:pb-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
            Grocery list
          </h1>
          {totalCount > 0 && (
            <p className="text-sm text-[#6B6B6B] mt-1 tabular-nums">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}, {checkedCount} checked
            </p>
          )}
        </div>

        {totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleExportList}
              aria-label="Export grocery list as text to clipboard"
              className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#EADFD2] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#EADFD2] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Print</span>
            </button>

            <button
              type="button"
              disabled={checkedCount === 0}
              onClick={() => setConfirmClearCheckedOpen(true)}
              className="hidden sm:inline-flex min-h-[44px] px-3.5 rounded-xl bg-white border border-[#EADFD2] hover:border-[#E4572E] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-[#2B2B2B] items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Clear checked</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmClearAllOpen(true)}
              className="min-h-[44px] px-3.5 rounded-xl border border-[#A63429]/40 bg-white hover:bg-[#A63429]/8 text-sm font-medium text-[#A63429] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </header>

      {storageUnavailable && (
        <div
          role="alert"
          className="bg-[#E4572E]/10 border border-[#E4572E]/40 text-[#2B2B2B] rounded-2xl px-4 py-3 text-sm flex items-center gap-2.5 no-print"
        >
          <AlertTriangle
            className="w-4 h-4 text-[#E4572E] shrink-0"
            aria-hidden="true"
          />
          <span>Your changes may not be saved on this browser.</span>
        </div>
      )}

      {/* Budget Estimate Card above the grocery list */}
      {totalCount > 0 && showCost && (
        <section
          aria-label="Shopping budget estimate"
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-2 no-print"
        >
          <p role="status" aria-live="polite" className="sr-only">
            {budgetScreenReaderSentence}
          </p>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div aria-hidden="true" className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 text-[#2B2B2B]">
                <IndianRupee className="w-4 h-4 text-[#1F6E42] shrink-0" aria-hidden="true" />
                <p className="font-heading text-lg sm:text-xl font-bold tabular-nums">
                  Estimated total: {totalCostText}
                </p>
              </div>

              <p className="text-sm font-semibold text-[#1F6E42] tabular-nums">
                Left to buy: {leftToBuyText}
              </p>

              {costSummary.unknownCount > 0 && (
                <p className="text-xs sm:text-sm text-[#2B2B2B] tabular-nums">
                  {totalCostText} for {costSummary.knownCount}{' '}
                  {costSummary.knownCount === 1 ? 'item' : 'items'}.{' '}
                  {costSummary.unknownCount}{' '}
                  {costSummary.unknownCount === 1 ? 'item has' : 'items have'} no
                  price estimate.
                </p>
              )}

              <p className="text-xs text-[#6B6B6B]">
                Estimate. Prices may differ in your market.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPriceSheetOpen(true)}
              className="min-h-[44px] px-3.5 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              <span>Edit prices</span>
            </button>
          </div>
        </section>
      )}

      {/* Share Read-Only Grocery List Link Section */}
      {totalCount > 0 && (
        <section
          aria-label="Share grocery list"
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print"
        >
          <div className="space-y-3 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-[#2B2B2B]">
              Anyone with this link can see the list. It cannot be taken back once shared.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleShareList}
                className="min-h-[44px] px-4 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                <span>Share list</span>
              </button>

              <button
                type="button"
                onClick={handleOpenShareQr}
                className="min-h-[44px] px-4 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4" aria-hidden="true" />
                <span>QR code</span>
              </button>

              {mailtoShare.ok && (
                <a
                  href={mailtoShare.mailtoUrl}
                  aria-label="Email grocery list"
                  className="min-h-[44px] px-4 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Email</span>
                </a>
              )}
            </div>

            <p className="text-xs text-[#6B6B6B]">
              To stop sharing, make a new list and share that instead.
            </p>

            {safeList.length > MAX_SHARED_ITEMS && (
              <p role="alert" className="text-xs font-medium text-[#A63429]">
                {SHARED_LIST_TOO_LONG_ERROR}
              </p>
            )}
          </div>

          {inlineQrDataUrl && (
            <button
              type="button"
              onClick={handleOpenShareQr}
              aria-label="Open larger QR code for shared grocery list"
              className="self-start sm:self-center shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-[#FFF9F2] transition-colors cursor-pointer"
            >
              <img
                src={inlineQrDataUrl}
                alt="QR code for shared grocery list"
                width={128}
                height={128}
                referrerPolicy="no-referrer"
                className="w-28 h-28 sm:w-32 sm:h-32 block rounded-lg"
              />
              <span className="text-xs text-[#6B6B6B] font-medium">
                Scan to open
              </span>
            </button>
          )}
        </section>
      )}

      {totalCount === 0 ? (
        <section className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-[#EADFD2] text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF9F2] border border-[#EADFD2] flex items-center justify-center mx-auto">
            <ShoppingBasket
              className="w-8 h-8 text-[#E4572E]"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="font-heading text-xl font-bold text-[#2B2B2B]">
              Your list is empty
            </h2>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              Add missing ingredients from any recipe to plan your shopping
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToCook}
            className="min-h-[44px] px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ChefHat className="w-4 h-4" aria-hidden="true" />
            <span>Go to Cook</span>
          </button>
        </section>
      ) : (
        <div className="space-y-4">
          {/* Category Sort & Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EADFD2] space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isSortByCategory}
                onClick={handleToggleSortByCategory}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-[#EADFD2] bg-[#FFF9F2] hover:border-[#2B2B2B] inline-flex items-center justify-between sm:justify-start gap-3 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-[#2B2B2B] whitespace-nowrap">
                  Sort by Category
                </span>
                <span className="inline-flex items-center gap-2 shrink-0">
                  <span
                    aria-hidden="true"
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                      isSortByCategory ? 'bg-[#1F6E42]' : 'bg-[#CFC6BB]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-150 ${
                        isSortByCategory ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </span>
                  <span className="text-xs font-semibold text-[#6B6B6B] w-6 text-left">
                    {isSortByCategory ? 'On' : 'Off'}
                  </span>
                </span>
              </button>

              <div className="flex items-center gap-2 sm:flex-1 sm:justify-end">
                <ArrowUpDown className="w-4 h-4 text-[#6B6B6B] shrink-0" aria-hidden="true" />
                <label
                  htmlFor="grocery-sort"
                  className="text-sm font-medium text-[#2B2B2B] whitespace-nowrap"
                >
                  Order
                </label>
                <select
                  id="grocery-sort"
                  value={sortBy}
                  onChange={(e) => handleSelectSortBy(e.target.value)}
                  className="flex-1 sm:flex-none sm:w-52 min-h-[44px] px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm font-medium text-[#2B2B2B] cursor-pointer"
                >
                  {GROCERY_SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {availableCategories.length > 1 && (
              <div
                className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F3EAE0]"
                role="group"
                aria-label="Filter grocery items by category"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  aria-pressed={selectedCategory === 'all'}
                  className={`min-h-[44px] px-3 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#2B2B2B] text-white font-semibold'
                      : 'bg-[#FFF9F2] border border-[#EADFD2] text-[#2B2B2B] hover:border-[#2B2B2B]'
                  }`}
                >
                  All <span className="tabular-nums">({totalCount})</span>
                </button>
                {availableCategories.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategory((prev) =>
                          prev === cat.id ? 'all' : cat.id
                        )
                      }
                      aria-pressed={active}
                      className={`min-h-[44px] px-3 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#C5411B] text-white font-semibold'
                          : 'bg-[#FFF9F2] border border-[#EADFD2] text-[#2B2B2B] hover:border-[#C5411B]'
                      }`}
                    >
                      {cat.label}{' '}
                      <span className="tabular-nums">({cat.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {grouped.map((group, groupIndex) => {
            const canReorderAisle =
              sortedView.mode === 'grouped' &&
              sortBy === 'aisle' &&
              selectedCategory === 'all' &&
              grouped.length > 1;
            const isProduce =
              group.category === 'vegetables' || group.category === 'fruits';

            return (
              <section
                key={group.category}
                aria-labelledby={`grocery-cat-${group.category}`}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-[#F3EAE0]">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2
                      id={`grocery-cat-${group.category}`}
                      className="font-heading text-base font-semibold text-[#2B2B2B]"
                    >
                      {group.label}
                    </h2>
                    {isProduce && (
                      <span className="text-xs text-[#6B6B6B]">
                        · Produce
                      </span>
                    )}
                    <span className="text-xs text-[#6B6B6B] tabular-nums">
                      · {group.items.length}{' '}
                      {group.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 no-print">
                    {group.category === 'meat_fish' && (
                      <span className="text-xs font-medium text-[#A63429] mr-1">
                        Non-veg items on your list
                      </span>
                    )}

                    {canReorderAisle && (
                      <>
                        <button
                          type="button"
                          disabled={groupIndex === 0}
                          onClick={() => handleMoveCategory(group.category, -1)}
                          aria-label={`Move ${group.label} up in shopping order`}
                          title="Move category up"
                          className="min-w-[44px] min-h-[44px] rounded-xl text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FFF9F2] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={groupIndex === grouped.length - 1}
                          onClick={() => handleMoveCategory(group.category, 1)}
                          aria-label={`Move ${group.label} down in shopping order`}
                          title="Move category down"
                          className="min-w-[44px] min-h-[44px] rounded-xl text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FFF9F2] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <ul className="divide-y divide-[#F3EAE0]" role="list">
                {group.items.map((item) => {
                  const isChecked = Boolean(item.checked);
                  const checkboxId = `grocery-check-${item.id}`;
                  const itemName = safeDisplay(item.name);
                  const qtyText = safeDisplay(item.quantityText);
                  const itemPaise = lineCostById.get(String(item.id || '')) ?? null;
                  const rawRecipeIds = Array.isArray(item.fromRecipeIds)
                    ? item.fromRecipeIds
                    : [];
                  const sourceNames = Array.from(
                    new Set(
                      rawRecipeIds.map(
                        (rid) => recipeNameMap.get(rid) || 'Recipe unavailable'
                      )
                    )
                  );
                  const sourceLabel = sourceNames.join(', ');

                  return (
                    <li
                      key={item.id}
                      tabIndex={0}
                      onClick={() => onToggleChecked(item.id)}
                      onKeyDown={(e) => handleRowKeyDown(e, item)}
                      className="py-2 first:pt-1 last:pb-1 flex items-center justify-between gap-2 rounded-xl hover:bg-[#FFF9F2]/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative flex items-center justify-center">
                            <input
                              id={checkboxId}
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleChecked(item.id)}
                              aria-label={`Mark ${itemName} as ${
                                isChecked ? 'needed' : 'checked'
                              }`}
                              className="peer appearance-none w-6 h-6 rounded-lg border-2 border-[#DFD3C5] checked:bg-[#1F6E42] checked:border-[#1F6E42] transition-colors cursor-pointer"
                            />
                            <Check
                              className="w-4 h-4 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-150"
                              aria-hidden="true"
                            />
                          </div>
                        </div>

                        <IngredientTile
                          ingredient={
                            getIngredientById(item.ingredientId) ?? {
                              id: item.ingredientId,
                              name: itemName,
                              category: item.category,
                            }
                          }
                          size="sm"
                          showImage={showIngredientImages}
                          className={isChecked ? 'opacity-55' : ''}
                        />

                        <label
                          htmlFor={checkboxId}
                          onClick={(e) => e.preventDefault()}
                          className="min-w-0 flex-1 py-1 cursor-pointer"
                        >
                          <span
                            className={`block text-sm sm:text-base font-medium leading-snug transition-colors ${
                              isChecked
                                ? 'line-through text-[#6B6B6B]'
                                : 'text-[#2B2B2B]'
                            }`}
                          >
                            {itemName}
                          </span>
                          <span className="block text-xs text-[#6B6B6B] tabular-nums mt-0.5 truncate">
                            {qtyText}
                            {sortedView.mode === 'flat'
                              ? ` · ${getCategoryLabel(item.category)}`
                              : ''}
                            {sourceLabel ? ` · ${sourceLabel}` : ''}
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {showCost && (
                          <>
                            <span
                              className={`text-xs sm:text-sm font-medium tabular-nums whitespace-nowrap print:hidden ${
                                isChecked ? 'text-[#6B6B6B]' : 'text-[#2B2B2B]'
                              }`}
                            >
                              {itemPaise !== null ? `≈ ${formatInr(itemPaise)}` : '-'}
                            </span>
                            <span className="hidden print:inline text-xs font-medium tabular-nums text-[#2B2B2B]">
                              {itemPaise !== null ? formatInr(itemPaise) : '(no price)'}
                            </span>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(item.id);
                          }}
                          aria-label={`Remove ${itemName} from grocery list`}
                          className="min-w-[44px] min-h-[44px] rounded-xl text-[#6B6B6B] hover:text-[#A63429] hover:bg-[#A63429]/8 flex items-center justify-center shrink-0 cursor-pointer no-print"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
            );
          })}

          {showCost && (
            <p className="hidden print:block text-sm font-semibold text-[#2B2B2B] pt-3 border-t border-[#EADFD2] tabular-nums">
              Estimated total: {totalCostText} (estimate)
            </p>
          )}
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar */}
      {totalCount > 0 && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-20 px-4 py-2.5 bg-gradient-to-t from-[#FFF9F2] via-[#FFF9F2] to-[#FFF9F2]/90 border-t border-[#EADFD2]/60 flex items-center gap-2.5 no-print">
          <button
            type="button"
            onClick={handleExportList}
            aria-label="Export grocery list as text to clipboard"
            className="flex-1 min-h-[44px] px-3 rounded-xl bg-white border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            <span>Export</span>
          </button>
          <button
            type="button"
            disabled={checkedCount === 0}
            onClick={() => setConfirmClearCheckedOpen(true)}
            className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#C5411B] disabled:opacity-40 text-white font-heading font-semibold text-sm inline-flex items-center justify-center cursor-pointer"
          >
            Clear checked
          </button>
        </div>
      )}

      {/* Edit Prices Sheet */}
      <PriceEditSheet
        open={priceSheetOpen}
        groceryList={safeList}
        prices={prices}
        priceOverrides={priceOverrides}
        onSavePrices={(nextOverrides) => {
          onSavePrices?.(nextOverrides);
          setToast({
            variant: 'success',
            message: 'Ingredient price estimates updated.',
          });
        }}
        onResetItemPrice={(ingredientId) => {
          onResetItemPrice?.(ingredientId);
          setToast({
            variant: 'success',
            message: 'Item price restored to default.',
          });
        }}
        onClose={() => setPriceSheetOpen(false)}
      />

      {/* Confirm Clear Checked Dialog */}
      <Dialog
        open={confirmClearCheckedOpen}
        title="Clear checked items?"
        description={`Remove ${checkedCount} checked ${
          checkedCount === 1 ? 'item' : 'items'
        } from your grocery list?`}
        onClose={() => setConfirmClearCheckedOpen(false)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmClearCheckedOpen(false)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmClearCheckedOpen(false);
              onClearChecked();
            }}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Clear checked
          </button>
        </div>
      </Dialog>

      {/* Confirm Clear All Dialog */}
      <Dialog
        open={confirmClearAllOpen}
        title="Clear all grocery items?"
        description="This removes every item from your grocery list."
        onClose={() => setConfirmClearAllOpen(false)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmClearAllOpen(false)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmClearAllOpen(false);
              onClearAll();
            }}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#A63429] hover:bg-[#8E2A20] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Clear all
          </button>
        </div>
      </Dialog>

      {/* Confirm Keyboard Delete Single Item Dialog */}
      <Dialog
        open={Boolean(pendingDeleteItem)}
        title="Remove item?"
        description={
          pendingDeleteItem
            ? `Remove "${safeDisplay(pendingDeleteItem.name)}" from your grocery list?`
            : undefined
        }
        onClose={() => setPendingDeleteItem(null)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPendingDeleteItem(null)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (pendingDeleteItem) {
                onRemoveItem(pendingDeleteItem.id);
              }
              setPendingDeleteItem(null);
            }}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#A63429] hover:bg-[#8E2A20] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Remove
          </button>
        </div>
      </Dialog>

      {/* Fallback Export Dialog if clipboard permission is blocked */}
      <Dialog
        open={Boolean(exportModalText)}
        title="Export grocery list"
        description="Copy this text version of your grocery list into WhatsApp, Messages, or Notes."
        onClose={() => setExportModalText(null)}
      >
        <div className="space-y-3">
          <textarea
            readOnly
            rows={10}
            value={exportModalText ?? ''}
            onFocus={(e) => e.target.select()}
            aria-label="Plain-text grocery list"
            className="w-full p-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-xs font-mono text-[#2B2B2B]"
          />
          <button
            type="button"
            onClick={() => setExportModalText(null)}
            className="w-full min-h-[44px] px-4 rounded-xl bg-[#2B2B2B] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </Dialog>

      {/* QR Code Share Dialog */}
      <Dialog
        open={Boolean(shareQrModal)}
        title="Scan to open grocery list"
        description="Anyone with this link can see the list. It cannot be taken back once shared."
        onClose={() => setShareQrModal(null)}
      >
        <div className="space-y-4">
          {shareQrModal?.qrDataUrl ? (
            <div className="flex flex-col items-center gap-2.5 py-2">
              <div className="p-3 bg-white rounded-2xl border border-[#EADFD2]">
                <img
                  src={shareQrModal.qrDataUrl}
                  alt="QR code for shared grocery list"
                  width={240}
                  height={240}
                  referrerPolicy="no-referrer"
                  className="w-56 h-56 sm:w-60 sm:h-60 block"
                />
              </div>
              <p className="text-xs text-[#6B6B6B] tabular-nums text-center">
                Point any phone camera to scan · Read-only · {shareQrModal.itemCount}{' '}
                {shareQrModal.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          ) : (
            <div
              role="alert"
              className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] text-sm text-[#2B2B2B]"
            >
              {shareQrModal?.qrError ||
                'Could not generate a QR code for this list.'}
            </div>
          )}

          <p className="text-xs text-[#6B6B6B]">
            To stop sharing, make a new list and share that instead.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleCopyShareUrlFromQr}
              className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>Copy link</span>
            </button>

            {mailtoShare.ok && (
              <a
                href={mailtoShare.mailtoUrl}
                className="min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>Email</span>
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShareQrModal(null)}
            className="w-full min-h-[44px] px-4 rounded-xl bg-[#2B2B2B] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </Dialog>

      {/* Fallback Share Link Dialog if clipboard permission is blocked */}
      <Dialog
        open={Boolean(shareFallbackUrl)}
        title="Share grocery list"
        description="Anyone with this link can see the list. It cannot be taken back once shared."
        onClose={() => {
          setShareFallbackUrl(null);
          setShareFallbackQrUrl('');
        }}
      >
        <div className="space-y-3">
          {shareFallbackQrUrl && (
            <div className="flex justify-center py-1">
              <div className="p-2.5 bg-white rounded-2xl border border-[#EADFD2]">
                <img
                  src={shareFallbackQrUrl}
                  alt="QR code for shared grocery list"
                  width={200}
                  height={200}
                  referrerPolicy="no-referrer"
                  className="w-48 h-48 block"
                />
              </div>
            </div>
          )}
          <input
            type="text"
            readOnly
            value={shareFallbackUrl ?? ''}
            onFocus={(e) => e.target.select()}
            aria-label="Read-only shared grocery list link"
            className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-xs font-mono text-[#2B2B2B]"
          />
          <p className="text-xs text-[#6B6B6B]">
            To stop sharing, make a new list and share that instead.
          </p>
          <button
            type="button"
            onClick={() => {
              setShareFallbackUrl(null);
              setShareFallbackQrUrl('');
            }}
            className="w-full min-h-[44px] px-4 rounded-xl bg-[#2B2B2B] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </Dialog>

      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant ?? 'success'}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
};
