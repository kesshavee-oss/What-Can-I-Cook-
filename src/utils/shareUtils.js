// Pure recipe sharing text & 1080x1350 PNG share card generators for "What Can I Cook?".
import QRCode from 'qrcode';
import { getIngredientById } from '../recipes.js';
import { sortAndGroupGroceryItems } from './groceryUtils.js';

function formatAmountSimple(val) {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return '-';
  const rounded = Math.round(num * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * Format a clean shareable recipe message containing ONLY dish details
 * (name, cooking time, scaled ingredients, steps). Never includes household size
 * or personal cooked history.
 * @param {object} recipe
 * @param {Array<object>} scaledIngredients
 * @param {number|string} [servingsLabel]
 * @returns {string}
 */
export function buildShareRecipeText(recipe, scaledIngredients = [], servingsLabel) {
  if (!recipe || typeof recipe !== 'object') return '';
  const name = typeof recipe.name === 'string' && recipe.name.trim() ? recipe.name.trim() : 'Recipe';
  const prep = Math.max(0, Number(recipe.prepMinutes) || 0);
  const cook = Math.max(0, Number(recipe.cookMinutes) || 0);
  const totalMinutes = prep + cook;
  const dietLabel = recipe.diet === 'nonveg' ? 'Non-Veg' : 'Veg';

  const lines = [
    name,
    `${dietLabel} | ${totalMinutes > 0 ? `${totalMinutes} min` : '-'}${
      servingsLabel ? ` | ${servingsLabel} servings` : ''
    }`,
    '',
    'Ingredients:',
  ];

  const list = Array.isArray(scaledIngredients) && scaledIngredients.length > 0
    ? scaledIngredients
    : Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];

  for (const item of list) {
    if (!item) continue;
    const ing = getIngredientById(item.ingredientId);
    const label = ing?.name || item.ingredientId || '-';
    const amt = item.displayAmountText || `${formatAmountSimple(item.scaledAmount ?? item.amount)} ${item.displayUnit || item.unit || ''}`.trim();
    lines.push(`- ${label}: ${amt}${item.optional ? ' (optional)' : ''}`);
  }

  lines.push('', 'Steps:');
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  steps.forEach((step, idx) => {
    const txt = typeof step?.text === 'string' ? step.text.trim() : '';
    if (txt) lines.push(`${idx + 1}. ${txt}`);
  });

  lines.push('', 'Made with What Can I Cook?');
  return lines.join('\n');
}

function wrapTextLines(ctx, text, maxWidth, maxLines = 3) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Render a 1080x1350 PNG share card on an offscreen HTML5 Canvas.
 * @returns {Promise<Blob>}
 */
export function renderRecipeShareCanvas(recipe, scaledIngredients = [], visual = {}) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Canvas rendering requires a browser document.'));
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context is unavailable.'));
      return;
    }

    const bgCream = '#FFF9F2';
    const cardBg = '#FFFFFF';
    const ink = '#2B2B2B';
    const muted = '#595959';
    const border = '#EADFD2';
    const diet = recipe?.diet === 'nonveg' ? 'nonveg' : 'veg';
    const dietColor = diet === 'veg' ? '#1F6E42' : '#C5411B';
    const accent = visual?.accent || dietColor;
    const motifBg = visual?.color || '#FFF1DC';

    // Canvas backdrop
    ctx.fillStyle = bgCream;
    ctx.fillRect(0, 0, 1080, 1350);

    // Outer card
    ctx.fillStyle = cardBg;
    drawRoundedRect(ctx, 56, 56, 968, 1238, 36);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Top motif banner
    ctx.fillStyle = motifBg;
    drawRoundedRect(ctx, 96, 96, 888, 310, 28);
    ctx.fill();

    // Decorative plate illustration in banner
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(540, 251, 96, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(540, 251, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(526, 244, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(562, 260, 18, 0, Math.PI * 2);
    ctx.fill();

    // Diet badge inside banner top-right
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, 792, 124, 160, 52, 16);
    ctx.fill();
    ctx.strokeStyle = dietColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = dietColor;
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(diet === 'veg' ? 'VEG' : 'NON-VEG', 872, 150);

    // Title
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = ink;
    ctx.font = 'bold 54px Georgia, serif';
    const titleLines = wrapTextLines(ctx, recipe?.name || 'Recipe', 880, 2);
    let y = 446;
    for (const line of titleLines) {
      ctx.fillText(line, 100, y);
      y += 66;
    }

    // Time & cuisine meta
    const totalMin = (Number(recipe?.prepMinutes) || 0) + (Number(recipe?.cookMinutes) || 0);
    ctx.fillStyle = muted;
    ctx.font = '600 28px system-ui, -apple-system, sans-serif';
    const metaText = [
      totalMin > 0 ? `${totalMin} min` : '-',
      recipe?.cuisine || '',
    ]
      .filter(Boolean)
      .join('  •  ');
    ctx.fillText(metaText, 100, y + 12);
    y += 74;

    // Divider
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, y);
    ctx.lineTo(980, y);
    ctx.stroke();
    y += 38;

    // Top 5 ingredients
    ctx.fillStyle = ink;
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('Key Ingredients', 100, y);
    y += 56;

    const topIngredients = (
      Array.isArray(scaledIngredients) && scaledIngredients.length > 0
        ? scaledIngredients
        : Array.isArray(recipe?.ingredients)
        ? recipe.ingredients
        : []
    ).slice(0, 5);

    ctx.font = '500 28px system-ui, -apple-system, sans-serif';
    for (const item of topIngredients) {
      const ing = getIngredientById(item?.ingredientId);
      const label = ing?.name || item?.ingredientId || '-';
      const amt =
        item?.displayAmountText ||
        `${formatAmountSimple(item?.scaledAmount ?? item?.amount)} ${item?.displayUnit || item?.unit || ''}`.trim();

      ctx.fillStyle = dietColor;
      ctx.beginPath();
      ctx.arc(116, y + 16, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ink;
      ctx.fillText(label, 144, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = muted;
      ctx.fillText(amt, 976, y);
      ctx.textAlign = 'left';
      y += 64;
    }

    // Footer brand strip
    ctx.fillStyle = bgCream;
    drawRoundedRect(ctx, 96, 1152, 888, 96, 20);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.font = 'bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Made with What Can I Cook?', 540, 1200);

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not generate PNG image from canvas.'));
      }
    }, 'image/png');
  });
}

// Self-tests
(function runSelfTests() {
  const sampleRecipe = {
    id: 'poha',
    name: 'Kanda Poha',
    diet: 'veg',
    prepMinutes: 10,
    cookMinutes: 10,
    ingredients: [
      { ingredientId: 'poha', amount: 1.5, unit: 'cup', optional: false },
      { ingredientId: 'onion', amount: 1, unit: 'pcs', optional: false },
    ],
    steps: [
      { text: 'Rinse poha gently and drain.' },
      { text: 'Temper mustard seeds and saute onion.' },
    ],
  };

  const shared = buildShareRecipeText(sampleRecipe, sampleRecipe.ingredients, '2');
  console.assert(
    shared.includes('Kanda Poha') &&
      shared.includes('20 min') &&
      shared.includes('Poha (Flattened Rice): 1.5 cup') &&
      shared.includes('1. Rinse poha gently and drain.') &&
      shared.includes('Made with What Can I Cook?') &&
      !shared.toLowerCase().includes('household') &&
      !shared.toLowerCase().includes('cooked on'),
    `Unexpected shared text format:\n${shared}`
  );
})();

// ---------------------------------------------------------------------------
// Read-only URL-fragment grocery list sharing (no server, #list=<base64url>)
// ---------------------------------------------------------------------------

export const MAX_SHARED_ITEMS = 60;
export const MAX_SHARED_PAYLOAD_BYTES = 20 * 1024;
export const SHARED_LIST_TOO_LONG_ERROR =
  'Share up to 60 items. Remove a few checked items first.';
export const SHARED_LIST_OPEN_ERROR =
  'This shared list could not be opened. Ask for a new link.';

const VALID_SHARED_CATEGORIES = new Set([
  'vegetables',
  'fruits',
  'meat_fish',
  'eggs_dairy',
  'grains_pulses',
  'spices_herbs',
  'pantry',
]);

function stripControlChars(str) {
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      out += ' ';
    } else {
      out += str[i];
    }
  }
  return out;
}

function sanitizePlainText(val, maxLen = 120) {
  if (typeof val !== 'string') return '';
  const cleaned = stripControlChars(val).replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, maxLen);
}

function sanitizeCategory(cat) {
  return typeof cat === 'string' && VALID_SHARED_CATEGORIES.has(cat) ? cat : 'pantry';
}

function utf8ToBytes(str) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'utf8'));
  }
  const encoded = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i += 1) {
    bytes[i] = encoded.charCodeAt(i);
  }
  return bytes;
}

function bytesToUtf8(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('utf8');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return decodeURIComponent(escape(binary));
}

function bytesToBase64Url(bytes) {
  let base64 = '';
  if (typeof btoa === 'function') {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const slice = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(slice));
    }
    base64 = btoa(binary);
  } else if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64');
  } else {
    throw new Error('Base64 encoding is unavailable.');
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Empty token');
  }
  if (/[^A-Za-z0-9\-_]/.test(token)) {
    throw new Error('Invalid base64url character');
  }
  let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  if (padLen === 3) {
    throw new Error('Invalid base64url length');
  }
  base64 += '='.repeat(padLen);

  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  throw new Error('Base64 decoding is unavailable.');
}

function pickShareableItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const name = sanitizePlainText(item.name, 120);
  if (!name) return null;
  return {
    name,
    category: sanitizeCategory(item.category),
    quantityText: sanitizePlainText(item.quantityText, 60),
    checked: Boolean(item.checked),
  };
}

/**
 * Encode up to 60 grocery items into a UTF-8 safe base64url payload containing ONLY
 * { name, category, quantityText, checked } per item. Never includes household,
 * diet, allergies, cooked meals, favorites, plan, prices, or keys.
 */
export function encodeSharedGroceryList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      ok: false,
      error: 'Add at least one item before sharing.',
      encoded: '',
    };
  }
  if (items.length > MAX_SHARED_ITEMS) {
    return {
      ok: false,
      error: SHARED_LIST_TOO_LONG_ERROR,
      encoded: '',
    };
  }

  const sanitizedItems = [];
  for (const raw of items) {
    const picked = pickShareableItem(raw);
    if (picked) sanitizedItems.push(picked);
  }

  if (sanitizedItems.length === 0) {
    return {
      ok: false,
      error: 'Add at least one item before sharing.',
      encoded: '',
    };
  }
  if (sanitizedItems.length > MAX_SHARED_ITEMS) {
    return {
      ok: false,
      error: SHARED_LIST_TOO_LONG_ERROR,
      encoded: '',
    };
  }

  try {
    const json = JSON.stringify({ items: sanitizedItems });
    const bytes = utf8ToBytes(json);
    if (bytes.length > MAX_SHARED_PAYLOAD_BYTES) {
      return {
        ok: false,
        error: SHARED_LIST_TOO_LONG_ERROR,
        encoded: '',
      };
    }
    return {
      ok: true,
      encoded: bytesToBase64Url(bytes),
      itemCount: sanitizedItems.length,
      byteLength: bytes.length,
      error: null,
    };
  } catch {
    return {
      ok: false,
      error: SHARED_LIST_TOO_LONG_ERROR,
      encoded: '',
    };
  }
}

/**
 * Build a full shareable URL with the list encoded after "#list=".
 */
export function buildShareGroceryUrl(items, baseHref) {
  const encodedRes = encodeSharedGroceryList(items);
  if (!encodedRes.ok) {
    return { ok: false, error: encodedRes.error, url: '' };
  }

  let base = '/app/';
  const candidateHref =
    typeof baseHref === 'string' && baseHref.trim()
      ? baseHref.trim()
      : typeof window !== 'undefined' && window.location
      ? window.location.href
      : '';

  if (candidateHref) {
    const hashIdx = candidateHref.indexOf('#');
    base = hashIdx >= 0 ? candidateHref.slice(0, hashIdx) : candidateHref;
  }

  return {
    ok: true,
    error: null,
    url: `${base}#list=${encodedRes.encoded}`,
    itemCount: encodedRes.itemCount,
  };
}

/**
 * Detect whether a URL hash string carries a "#list=" shared grocery list fragment.
 */
export function isSharedGroceryHash(hashStr) {
  if (typeof hashStr !== 'string') return false;
  const normalized = hashStr.startsWith('#') ? hashStr.slice(1) : hashStr;
  return normalized.startsWith('list=');
}

/**
 * Decode and sanitize a "#list=" URL fragment into plain-text read-only grocery items.
 * Enforces the 20 KB decoded byte limit BEFORE JSON.parse and rejects >60 items.
 * Never throws.
 */
export function decodeSharedGroceryFragment(hashOrFragment) {
  try {
    if (typeof hashOrFragment !== 'string' || !hashOrFragment.trim()) {
      return { ok: false, error: SHARED_LIST_OPEN_ERROR, items: [] };
    }
    const rawHash = hashOrFragment.trim();
    const listMarkerIdx = rawHash.indexOf('list=');
    if (listMarkerIdx === -1) {
      return { ok: false, error: SHARED_LIST_OPEN_ERROR, items: [] };
    }
    // Reject if fragment does not begin with #list= or list=
    const prefix = rawHash.slice(0, listMarkerIdx);
    if (prefix !== '' && prefix !== '#') {
      return { ok: false, error: SHARED_LIST_OPEN_ERROR, items: [] };
    }

    const token = rawHash.slice(listMarkerIdx + 'list='.length).trim();
    // Guard raw base64url length before decoding (~27.3 KB max for 20 KB decoded)
    const maxTokenLength = Math.ceil((MAX_SHARED_PAYLOAD_BYTES * 4) / 3) + 4;
    if (!token || token.length > maxTokenLength) {
      return { ok: false, error: SHARED_LIST_OPEN_ERROR, items: [] };
    }

    const bytes = base64UrlToBytes(token);
    if (bytes.length === 0 || bytes.length > MAX_SHARED_PAYLOAD_BYTES) {
      return { ok: false, error: SHARED_LIST_OPEN_ERROR, items: [] };
    }

    const jsonText = bytesToUtf8(bytes);
    const parsed = JSON.parse(jsonText);

    const rawItems = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray(parsed.items)
      ? parsed.items
      : null;

    if (!rawItems || rawItems.length === 0 || rawItems.length > MAX_SHARED_ITEMS) {
      return { ok: false, error: SHARED_LIST_OPEN_ERROR, items: [] };
    }

    const cleanItems = [];
    for (let i = 0; i < rawItems.length; i += 1) {
      const picked = pickShareableItem(rawItems[i]);
      if (!picked) {
        return { ok: false, error: SHARED_LIST_OPEN_ERROR, items: [] };
      }
      cleanItems.push({
        id: `shared-${i}`,
        name: picked.name,
        category: picked.category,
        quantityText: picked.quantityText,
        checked: picked.checked,
      });
    }

    return {
      ok: true,
      error: null,
      items: cleanItems,
    };
  } catch {
    return { ok: false, error: SHARED_LIST_OPEN_ERROR, items: [] };
  }
}

/**
 * Generate a scannable PNG QR code data URL for a shared grocery list URL.
 * Runs completely client-side with zero network requests and never throws.
 */
export async function generateSharedGroceryQrDataUrl(shareUrl) {
  try {
    if (typeof shareUrl !== 'string' || !shareUrl.trim()) {
      return {
        ok: false,
        dataUrl: '',
        error: 'Share link is empty.',
      };
    }

    const trimmed = shareUrl.trim();
    const errorCorrectionLevel = trimmed.length > 1200 ? 'L' : 'M';
    const dataUrl = await QRCode.toDataURL(trimmed, {
      errorCorrectionLevel,
      margin: 2,
      width: 280,
      color: {
        dark: '#2B2B2B',
        light: '#FFFFFF',
      },
    });

    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return {
        ok: false,
        dataUrl: '',
        error: 'Could not generate a QR code for this list.',
      };
    }

    return {
      ok: true,
      dataUrl,
      error: null,
    };
  } catch {
    return {
      ok: false,
      dataUrl: '',
      error: 'This list is too large to fit in a single QR code. Use Share list or Email instead.',
    };
  }
}

/**
 * Build a mailto: URL pre-filled with ONLY sanitized plain-text grocery items
 * (name, category, quantityText, checked). Never includes household size, diet,
 * allergies, cooked history, prices, or API keys.
 */
export function buildShareGroceryMailtoUrl(items, options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      ok: false,
      mailtoUrl: '',
      error: 'Add at least one item before emailing.',
    };
  }

  const sanitizedItems = [];
  for (const raw of items) {
    const picked = pickShareableItem(raw);
    if (picked) sanitizedItems.push(picked);
  }

  if (sanitizedItems.length === 0) {
    return {
      ok: false,
      mailtoUrl: '',
      error: 'Add at least one item before emailing.',
    };
  }

  const grouped = sortAndGroupGroceryItems(sanitizedItems, {
    sortBy: options?.sortBy || 'aisle',
    selectedCategory: 'all',
    categoryOrder: options?.categoryOrder,
  }).groups;

  const sections = grouped.map((group) => {
    const lines = group.items.map((item) => {
      const mark = item.checked ? '[x]' : '[ ]';
      const qty =
        item.quantityText && item.quantityText !== '-' ? ` (${item.quantityText})` : '';
      return `${mark} ${item.name}${qty}`;
    });
    return `${group.label}\n${lines.join('\n')}`;
  });

  const itemCount = sanitizedItems.length;
  const subject = `Grocery list (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`;
  let body = `${subject}\n\n${sections.join('\n\n')}`;

  // Guard against email client URL length limits (~6000 decoded chars)
  const MAX_EMAIL_BODY_CHARS = 5500;
  if (body.length > MAX_EMAIL_BODY_CHARS) {
    body = `${body.slice(0, MAX_EMAIL_BODY_CHARS).trimEnd()}\n\n... (list shortened for email)`;
  }

  return {
    ok: true,
    mailtoUrl: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    error: null,
  };
}

// Self-tests for shared grocery URL encoding/decoding, privacy stripping, limits, QR, and Email
(function runShareLinkSelfTests() {
  // 1. Round-trip with non-English / Unicode characters
  const unicodeItems = [
    { name: 'पनीर (Paneer)', category: 'eggs_dairy', quantityText: '200 g', checked: false },
    { name: 'हल्दी · Turmeric', category: 'spices_herbs', quantityText: '1 tsp', checked: true },
    { name: 'पालक Spinach 🥬', category: 'vegetables', quantityText: '1 bunch', checked: false },
  ];
  const encodedRes = encodeSharedGroceryList(unicodeItems);
  console.assert(encodedRes.ok === true && encodedRes.encoded.length > 0, 'Unicode list should encode cleanly');
  const decodedRes = decodeSharedGroceryFragment(`#list=${encodedRes.encoded}`);
  console.assert(
    decodedRes.ok === true &&
      decodedRes.items.length === 3 &&
      decodedRes.items[0].name === 'पनीर (Paneer)' &&
      decodedRes.items[1].checked === true &&
      decodedRes.items[2].name === 'पालक Spinach 🥬',
    `Round-trip Unicode decode mismatch: ${JSON.stringify(decodedRes)}`
  );

  // 2. Extra sensitive fields (household, allergies, cookedMeals, prices, apiKey) are stripped on encoding
  const leakyItems = [
    {
      id: 'onion__pcs',
      ingredientId: 'onion',
      name: 'Onion',
      category: 'vegetables',
      quantityText: '4 pcs',
      checked: false,
      fromRecipeIds: ['poha'],
      household: { adults: 4, children: [{ ageGroup: 'toddler' }] },
      allergies: ['dairy', 'nut'],
      cookedMeals: [{ id: 'secret' }],
      prices: { perUnitPaise: 9900 },
      apiKey: 'AIzaSecretKey',
    },
  ];
  const strippedUrlRes = buildShareGroceryUrl(leakyItems, 'https://example.com/app/');
  console.assert(
    strippedUrlRes.ok === true && strippedUrlRes.url.startsWith('https://example.com/app/#list='),
    'Share URL builder failed'
  );
  const hashPart = strippedUrlRes.url.slice(strippedUrlRes.url.indexOf('#'));
  const rawToken = hashPart.replace('#list=', '');
  const rawDecodedJson = bytesToUtf8(base64UrlToBytes(rawToken));
  console.assert(
    !rawDecodedJson.includes('household') &&
      !rawDecodedJson.includes('allergies') &&
      !rawDecodedJson.includes('cookedMeals') &&
      !rawDecodedJson.includes('AIzaSecretKey') &&
      !rawDecodedJson.includes('perUnitPaise') &&
      !rawDecodedJson.includes('fromRecipeIds'),
    `Sensitive fields leaked into encoded URL payload: ${rawDecodedJson}`
  );
  const parsedStripped = JSON.parse(rawDecodedJson);
  const keys = Object.keys(parsedStripped.items[0]).sort().join(',');
  console.assert(keys === 'category,checked,name,quantityText', `Unexpected encoded keys: ${keys}`);

  // 3. Malformed fragments return an error result and never throw
  for (const bad of ['', '#list=', '#list=!!!not-base64!!!', '#list=e30', '#other=123', '#list=YWJj']) {
    const res = decodeSharedGroceryFragment(bad);
    console.assert(
      res.ok === false && res.error === SHARED_LIST_OPEN_ERROR && Array.isArray(res.items),
      `Malformed fragment "${bad}" should return safe error result`
    );
  }

  // 4. List over 60 items is rejected on encode and decode
  const tooMany = Array.from({ length: 61 }, (_, i) => ({
    name: `Item ${i + 1}`,
    category: 'pantry',
    quantityText: '1 pc',
    checked: false,
  }));
  const overLimitRes = encodeSharedGroceryList(tooMany);
  console.assert(
    overLimitRes.ok === false && overLimitRes.error === SHARED_LIST_TOO_LONG_ERROR,
    'Lists over 60 items must be rejected'
  );
  const craftedOver60 = bytesToBase64Url(utf8ToBytes(JSON.stringify({ items: tooMany })));
  console.assert(
    decodeSharedGroceryFragment(`#list=${craftedOver60}`).ok === false,
    'Crafted >60 item fragment must fail decoding'
  );

  // 5. Payload over 20 KB is rejected before parsing
  const giantBytes = new Uint8Array(MAX_SHARED_PAYLOAD_BYTES + 10).fill(97);
  const giantRes = decodeSharedGroceryFragment(`#list=${bytesToBase64Url(giantBytes)}`);
  console.assert(
    giantRes.ok === false && giantRes.error === SHARED_LIST_OPEN_ERROR,
    'Payloads over 20 KB must be rejected'
  );

  // 6. Email mailto builder strips sensitive fields and formats plain text cleanly
  const mailtoRes = buildShareGroceryMailtoUrl([...leakyItems, ...unicodeItems]);
  console.assert(
    mailtoRes.ok === true && mailtoRes.mailtoUrl.startsWith('mailto:?subject='),
    'Mailto URL builder failed'
  );
  const decodedMailto = decodeURIComponent(mailtoRes.mailtoUrl);
  console.assert(
    decodedMailto.includes('Onion (4 pcs)') &&
      decodedMailto.includes('पनीर (Paneer) (200 g)') &&
      !decodedMailto.includes('AIzaSecretKey') &&
      !decodedMailto.includes('allergies') &&
      !decodedMailto.includes('household') &&
      !decodedMailto.includes('cookedMeals') &&
      !decodedMailto.includes('9900'),
    `Mailto URL leaked sensitive data or missed items: ${decodedMailto}`
  );

  // 7. QR code generator produces a valid PNG data URI and handles empty/oversized inputs safely
  void generateSharedGroceryQrDataUrl(strippedUrlRes.url).then((qrRes) => {
    console.assert(
      qrRes.ok === true && qrRes.dataUrl.startsWith('data:image/png;base64,'),
      'QR code data URL generation failed for valid share link'
    );
  });
  void generateSharedGroceryQrDataUrl('').then((emptyQrRes) => {
    console.assert(
      emptyQrRes.ok === false && emptyQrRes.dataUrl === '',
      'Empty URL should safely fail QR generation'
    );
  });
})();

