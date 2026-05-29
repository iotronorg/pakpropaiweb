import 'server-only'

export type TenantTheme = {
  primary_color:   string
  secondary_color: string
  accent_color:    string
  logo_url:        string
}

export const PLATFORM_DEFAULTS: TenantTheme = {
  primary_color:   '#2563EB',
  secondary_color: '#4F46E5',
  accent_color:    '#0891B2',
  logo_url:        '',
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const f = 1 - amount
  const d = (n: number) => Math.max(0, Math.round(n * f)).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

function lightenHex(hex: string, lightness: number): string {
  const [r, g, b] = hexToRgb(hex)
  const l = (n: number) => Math.min(255, Math.round(n + (255 - n) * lightness)).toString(16).padStart(2, '0')
  return `#${l(r)}${l(g)}${l(b)}`
}

export function buildCssVars(theme: TenantTheme): string {
  const [pr, pg, pb] = hexToRgb(theme.primary_color)
  const [sr, sg, sb] = hexToRgb(theme.secondary_color)
  return [
    `--primary:${theme.primary_color}`,
    `--primary-dark:${darkenHex(theme.primary_color, 0.1)}`,
    `--primary-light:${lightenHex(theme.primary_color, 0.94)}`,
    `--primary-dim:rgba(${pr},${pg},${pb},0.08)`,
    `--secondary:${theme.secondary_color}`,
    `--secondary-dim:rgba(${sr},${sg},${sb},0.08)`,
    `--accent:${theme.accent_color}`,
  ].join(';')
}

export async function fetchTenantTheme(host: string): Promise<TenantTheme> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
  try {
    const res = await fetch(`${base}/theme/`, {
      headers: { Host: host },
      next: { revalidate: 300 },
    })
    if (!res.ok) return PLATFORM_DEFAULTS
    const data = await res.json() as Partial<TenantTheme>
    return {
      primary_color:   data.primary_color   ?? PLATFORM_DEFAULTS.primary_color,
      secondary_color: data.secondary_color ?? PLATFORM_DEFAULTS.secondary_color,
      accent_color:    data.accent_color    ?? PLATFORM_DEFAULTS.accent_color,
      logo_url:        data.logo_url        ?? '',
    }
  } catch {
    return PLATFORM_DEFAULTS
  }
}
