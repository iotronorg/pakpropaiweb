"use client";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPage }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const prev = page > 1;
  const next = page < totalPages;

  const windowStart = Math.max(1, page - 2);
  const windowEnd   = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-1 pt-3 mt-4">
      <p className="text-xs text-gray-500">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={!prev}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ‹ Prev
        </button>
        {windowStart > 1 && (
          <>
            <button onClick={() => onPage(1)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">1</button>
            {windowStart > 2 && <span className="px-1 text-xs text-gray-400">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              p === page
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
        {windowEnd < totalPages && (
          <>
            {windowEnd < totalPages - 1 && <span className="px-1 text-xs text-gray-400">…</span>}
            <button onClick={() => onPage(totalPages)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={!next}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
