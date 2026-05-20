import { formatCurrency, formatAreaUnit, currencyCode, formatPKR } from '@/lib/utils';

// ── formatCurrency — Pakistan (PK) ──────────────────────────────────────────

describe('formatCurrency — Pakistan (PK)', () => {
  it('formats crore correctly', () => {
    expect(formatCurrency(15_000_000, 'PK')).toBe('PKR 1.50 Crore');
  });

  it('formats exactly 1 crore', () => {
    expect(formatCurrency(10_000_000, 'PK')).toBe('PKR 1.00 Crore');
  });

  it('formats lac correctly', () => {
    expect(formatCurrency(500_000, 'PK')).toBe('PKR 5.00 Lac');
  });

  it('formats small amounts without suffix', () => {
    const result = formatCurrency(50_000, 'PK');
    expect(result).toContain('PKR');
    expect(result).not.toContain('Crore');
    expect(result).not.toContain('Lac');
  });

  it('formatPKR alias produces same output as formatCurrency PK', () => {
    expect(formatPKR(10_000_000)).toBe(formatCurrency(10_000_000, 'PK'));
  });

  it('lowercase country code works', () => {
    expect(formatCurrency(15_000_000, 'pk')).toBe('PKR 1.50 Crore');
  });
});

// ── formatCurrency — UAE (AE) ───────────────────────────────────────────────

describe('formatCurrency — UAE (AE)', () => {
  it('formats millions in AED', () => {
    expect(formatCurrency(2_000_000, 'AE')).toBe('AED 2.00M');
  });

  it('formats thousands in AED', () => {
    expect(formatCurrency(500_000, 'AE')).toBe('AED 500K');
  });

  it('does not contain PKR, Crore, or Lac', () => {
    const result = formatCurrency(5_000_000, 'AE');
    expect(result).not.toContain('PKR');
    expect(result).not.toContain('Crore');
    expect(result).not.toContain('Lac');
  });

  it('contains AED symbol', () => {
    expect(formatCurrency(2_500_000, 'AE')).toContain('AED');
  });
});

// ── formatCurrency — UK (GB) ────────────────────────────────────────────────

describe('formatCurrency — UK (GB)', () => {
  it('formats millions with £ symbol', () => {
    expect(formatCurrency(1_500_000, 'GB')).toBe('£1.50M');
  });

  it('formats thousands with £ symbol', () => {
    expect(formatCurrency(350_000, 'GB')).toBe('£350K');
  });

  it('does not contain PKR or AED', () => {
    const result = formatCurrency(1_000_000, 'GB');
    expect(result).not.toContain('PKR');
    expect(result).not.toContain('AED');
  });
});

// ── formatCurrency — US ─────────────────────────────────────────────────────

describe('formatCurrency — US', () => {
  it('formats millions with $ symbol', () => {
    expect(formatCurrency(1_200_000, 'US')).toBe('$1.20M');
  });

  it('formats thousands with $ symbol', () => {
    expect(formatCurrency(800_000, 'US')).toBe('$800K');
  });
});

// ── formatCurrency — CA ─────────────────────────────────────────────────────

describe('formatCurrency — Canada (CA)', () => {
  it('formats millions with $ symbol', () => {
    expect(formatCurrency(900_000, 'CA')).toBe('$900K');
  });
});

// ── formatCurrency — unknown country ────────────────────────────────────────

describe('formatCurrency — unknown country', () => {
  it('falls back to locale formatting without crashing', () => {
    const result = formatCurrency(1_000_000, 'XX');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── formatAreaUnit ──────────────────────────────────────────────────────────

describe('formatAreaUnit', () => {
  it('returns Marla for Pakistan', () => {
    expect(formatAreaUnit(5, 'PK')).toBe('5 Marla');
  });

  it('returns sqft for UAE', () => {
    expect(formatAreaUnit(1200, 'AE')).toBe('1,200 sqft');
  });

  it('returns sqft for UK', () => {
    expect(formatAreaUnit(950, 'GB')).toBe('950 sqft');
  });

  it('returns sqft for US', () => {
    expect(formatAreaUnit(2000, 'US')).toBe('2,000 sqft');
  });

  it('returns sqft for Canada', () => {
    expect(formatAreaUnit(1500, 'CA')).toBe('1,500 sqft');
  });

  it('returns sqm for unknown country', () => {
    expect(formatAreaUnit(85, 'XX')).toBe('85 sqm');
  });

  it('lowercase country code works', () => {
    expect(formatAreaUnit(5, 'pk')).toBe('5 Marla');
    expect(formatAreaUnit(1200, 'ae')).toBe('1,200 sqft');
  });
});

// ── currencyCode ────────────────────────────────────────────────────────────

describe('currencyCode', () => {
  it('returns PKR for PK', () => {
    expect(currencyCode('PK')).toBe('PKR');
  });

  it('returns AED for AE', () => {
    expect(currencyCode('AE')).toBe('AED');
  });

  it('returns GBP for GB', () => {
    expect(currencyCode('GB')).toBe('GBP');
  });

  it('returns USD for US', () => {
    expect(currencyCode('US')).toBe('USD');
  });

  it('returns CAD for CA', () => {
    expect(currencyCode('CA')).toBe('CAD');
  });

  it('defaults to USD for unknown country', () => {
    expect(currencyCode('XX')).toBe('USD');
  });
});

// ── Organization Dashboard — regional formatting (E2E scenario) ─────────────

describe('Organization Dashboard — regional formatting', () => {
  it('UAE org shows AED amounts and sqft areas', () => {
    const orgCountry = 'AE';
    const budget = formatCurrency(2_500_000, orgCountry);
    const area   = formatAreaUnit(1_500, orgCountry);

    expect(budget).toContain('AED');
    expect(area).toContain('sqft');
    expect(budget).not.toContain('PKR');
    expect(area).not.toContain('Marla');
  });

  it('Pakistan org shows PKR amounts and Marla areas', () => {
    const orgCountry = 'PK';
    const budget = formatCurrency(15_000_000, orgCountry);
    const area   = formatAreaUnit(5, orgCountry);

    expect(budget).toContain('PKR');
    expect(area).toContain('Marla');
    expect(budget).not.toContain('AED');
    expect(area).not.toContain('sqft');
  });

  it('UK org shows GBP amounts and sqft areas', () => {
    const orgCountry = 'GB';
    const budget = formatCurrency(750_000, orgCountry);
    const area   = formatAreaUnit(1_200, orgCountry);

    expect(budget).toContain('£');
    expect(area).toContain('sqft');
  });

  it('currency and area unit are consistent for each market', () => {
    const markets = [
      { country: 'PK', expectedCurrency: 'PKR', expectedUnit: 'Marla' },
      { country: 'AE', expectedCurrency: 'AED', expectedUnit: 'sqft'  },
      { country: 'GB', expectedCurrency: '£',   expectedUnit: 'sqft'  },
      { country: 'US', expectedCurrency: '$',    expectedUnit: 'sqft'  },
    ];

    for (const { country, expectedCurrency, expectedUnit } of markets) {
      expect(formatCurrency(1_000_000, country)).toContain(expectedCurrency);
      expect(formatAreaUnit(100, country)).toContain(expectedUnit);
    }
  });
});
