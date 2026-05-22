import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a monetary amount using the conventions of the given country.
 * - PK: crore / lac notation in PKR
 * - AE: million / thousand in AED
 * - GB: thousands / millions in GBP (£)
 * - US / CA: thousands / millions in USD / CAD ($)
 * - default: locale-formatted number
 */
export function formatCurrency(amount: number, country: string = 'PK'): string {
  switch (country.toUpperCase()) {
    case 'PK':
      if (amount >= 10_000_000) return `PKR ${(amount / 10_000_000).toFixed(2)} Crore`;
      if (amount >= 100_000)    return `PKR ${(amount / 100_000).toFixed(2)} Lac`;
      return `PKR ${amount.toLocaleString('en-PK')}`;

    case 'AE':
      if (amount >= 1_000_000) return `AED ${(amount / 1_000_000).toFixed(2)}M`;
      if (amount >= 1_000)     return `AED ${(amount / 1_000).toFixed(0)}K`;
      return `AED ${amount.toLocaleString('en-AE')}`;

    case 'GB':
      if (amount >= 1_000_000) return `£${(amount / 1_000_000).toFixed(2)}M`;
      if (amount >= 1_000)     return `£${(amount / 1_000).toFixed(0)}K`;
      return `£${amount.toLocaleString('en-GB')}`;

    case 'US':
    case 'CA':
      if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
      if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}K`;
      return `$${amount.toLocaleString('en-US')}`;

    default:
      return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

/** Backward-compatible alias — existing callers of formatPKR continue to work. */
export const formatPKR = (amount: number): string => formatCurrency(amount, 'PK');

/**
 * Format canonical area (in sqm) using the org's measurement system.
 * - pk_traditional: Marla / Kanal
 * - imperial: sqft
 * - metric: m²
 */
export function formatArea(
  sqm: number | null | undefined,
  measurementSystem: string = 'pk_traditional',
): string {
  if (sqm == null) return '—';
  switch (measurementSystem) {
    case 'pk_traditional': {
      const marla = sqm / 25.2929;
      if (marla >= 20) return `${(marla / 20).toFixed(2)} Kanal`;
      return `${marla.toFixed(2)} Marla`;
    }
    case 'imperial': {
      const sqft = sqm / 0.092903;
      return `${Math.round(sqft).toLocaleString()} sqft`;
    }
    case 'metric':
    default:
      return `${sqm.toFixed(1)} m²`;
  }
}

/** @deprecated Use formatArea(area_sqm, org.measurement_system) instead. */
export function formatAreaUnit(value: number, country: string = 'PK'): string {
  switch (country.toUpperCase()) {
    case 'PK':
      return `${value} Marla`;
    case 'AE':
    case 'GB':
    case 'US':
    case 'CA':
      return `${value.toLocaleString()} sqft`;
    default:
      return `${value} sqm`;
  }
}

/**
 * Return the ISO 4217 currency code for a country.
 */
export function currencyCode(country: string = 'PK'): string {
  const MAP: Record<string, string> = {
    PK: 'PKR', AE: 'AED', GB: 'GBP', US: 'USD', CA: 'CAD',
  };
  return MAP[country.toUpperCase()] ?? 'USD';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function roleHomePath(role: string): string {
  switch (role) {
    case 'admin':     return '/admin';
    case 'agent':     return '/agent';
    case 'developer': return '/organization';
    default:          return '/login';
  }
}
