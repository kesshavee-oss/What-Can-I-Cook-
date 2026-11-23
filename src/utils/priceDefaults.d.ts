export interface PriceEntry {
  perUnitPaise: number;
  unit: string;
}

export type PriceMap = Record<string, PriceEntry>;

export const DEFAULT_PRICES: PriceMap;
export const PRICE_UNITS: string[];
