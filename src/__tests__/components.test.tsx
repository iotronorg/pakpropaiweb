/**
 * UI component unit tests — Task 6 of TEST-SUITE-PHASE2.
 *
 * Coverage:
 *   Badge          — renders label text; applies correct variant CSS class
 *   StatsCard      — renders label + value; shows trend icon; skeleton renders
 *   LoadingSpinner — renders for sm/md/lg; PageSkeleton renders shimmer rows
 *
 * framer-motion is mocked to avoid jsdom animation issues.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// ── Mock framer-motion — replace motion.div with a plain div ─────────────────
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, className, style }: React.HTMLAttributes<HTMLDivElement>,
        ref: React.Ref<HTMLDivElement>
      ) => (
        <div ref={ref} className={className} style={style}>
          {children}
        </div>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));


// ── Badge ─────────────────────────────────────────────────────────────────────

import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders the label text', () => {
    render(<Badge label="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('defaults to gray variant', () => {
    const { container } = render(<Badge label="Default" />);
    expect(container.firstChild).toHaveClass('bg-slate-100');
  });

  it('applies green variant classes', () => {
    const { container } = render(<Badge label="Done" variant="green" />);
    expect(container.firstChild).toHaveClass('bg-emerald-50');
    expect(container.firstChild).toHaveClass('text-emerald-700');
  });

  it('applies red variant classes', () => {
    const { container } = render(<Badge label="Error" variant="red" />);
    expect(container.firstChild).toHaveClass('bg-red-50');
    expect(container.firstChild).toHaveClass('text-red-700');
  });

  it('applies yellow variant classes', () => {
    const { container } = render(<Badge label="Pending" variant="yellow" />);
    expect(container.firstChild).toHaveClass('bg-amber-50');
  });

  it('applies blue variant classes', () => {
    const { container } = render(<Badge label="Info" variant="blue" />);
    expect(container.firstChild).toHaveClass('bg-sky-50');
  });

  it('applies purple variant classes', () => {
    const { container } = render(<Badge label="VIP" variant="purple" />);
    expect(container.firstChild).toHaveClass('bg-violet-50');
  });

  it('applies teal variant classes', () => {
    const { container } = render(<Badge label="New" variant="teal" />);
    expect(container.firstChild).toHaveClass('bg-teal-50');
  });
});


// ── StatsCard ─────────────────────────────────────────────────────────────────

import { StatsCard, StatsCardSkeleton } from '@/components/ui/StatsCard';

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Total Leads" value={42} />);
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders sub text when provided', () => {
    render(<StatsCard label="Revenue" value="PKR 2M" sub="this month" />);
    expect(screen.getByText('this month')).toBeInTheDocument();
  });

  it('does not render sub text when omitted', () => {
    const { queryByText } = render(<StatsCard label="Deals" value={5} />);
    expect(queryByText('this month')).not.toBeInTheDocument();
  });

  it('renders TrendingUp icon for trend=up', () => {
    const { container } = render(<StatsCard label="Growth" value="12%" trend="up" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders TrendingDown icon for trend=down', () => {
    const { container } = render(<StatsCard label="Churn" value="3%" trend="down" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders Minus icon for trend=flat', () => {
    const { container } = render(<StatsCard label="Stable" value="0%" trend="flat" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders no trend icon when trend is omitted', () => {
    render(<StatsCard label="Count" value={10} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('applies blue color class for value', () => {
    const { container } = render(<StatsCard label="L" value="V" color="blue" />);
    const valueEl = container.querySelector('.text-sky-600');
    expect(valueEl).toBeInTheDocument();
  });

  it('applies green color class for value', () => {
    const { container } = render(<StatsCard label="L" value="V" color="green" />);
    const valueEl = container.querySelector('.text-emerald-600');
    expect(valueEl).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const MockIcon = () => <svg data-testid="mock-icon" />;
    render(<StatsCard label="L" value="V" icon={MockIcon as any} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });
});

describe('StatsCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<StatsCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders shimmer elements', () => {
    const { container } = render(<StatsCardSkeleton />);
    const shimmers = container.querySelectorAll('.shimmer');
    expect(shimmers.length).toBeGreaterThan(0);
  });
});


// ── LoadingSpinner ────────────────────────────────────────────────────────────

import { LoadingSpinner, PageSkeleton } from '@/components/ui/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders for default (md) size', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('[style*="width: 32"]')).toBeInTheDocument();
  });

  it('renders for sm size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    expect(container.querySelector('[style*="width: 16"]')).toBeInTheDocument();
  });

  it('renders for lg size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    expect(container.querySelector('[style*="width: 48"]')).toBeInTheDocument();
  });

  it('renders spinner ring element', () => {
    const { container } = render(<LoadingSpinner />);
    const ring = container.querySelector('.rounded-full');
    expect(ring).toBeInTheDocument();
  });
});

describe('PageSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders shimmer placeholder rows', () => {
    const { container } = render(<PageSkeleton />);
    const shimmers = container.querySelectorAll('.shimmer');
    expect(shimmers.length).toBeGreaterThan(0);
  });

  it('renders 4 stat card skeletons', () => {
    const { container } = render(<PageSkeleton />);
    const cards = container.querySelectorAll('.rounded-xl');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });
});
