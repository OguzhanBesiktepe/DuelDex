"use client";

// Shared pagination component used across all card/set listing pages.
// Server pages: pass filterSuffix (plain string) — renders <a> links like ?page=3&type=foo
// Client components: pass onPage callback — renders <button> elements
// Shows: « ‹ Prev  1 2 … 5 [6] 7 … 41 42  Next › »

import React from "react";

type PaginationProps = {
  page: number;
  totalPages: number;
  total?: number;
  countLabel?: string; // e.g. "cards", "sets"
  accent?: string;     // highlight color for active page
  // For server pages: plain string appended after ?page={n}  e.g. "&type=spell"
  filterSuffix?: string;
  // For client components: callback instead of links
  onPage?: (p: number) => void;
};

function getPageItems(current: number, total: number): (number | "…")[] {
  const pages = Array.from({ length: total }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === total || Math.abs(p - current) <= 2,
  );
  return pages.reduce<(number | "…")[]>((acc, p, idx, arr) => {
    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
    acc.push(p);
    return acc;
  }, []);
}

export default function Pagination({
  page,
  totalPages,
  total,
  countLabel = "items",
  accent = "#FF7A00",
  filterSuffix = "",
  onPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const btnStyle = {
    background: "#0E1220",
    color: "#F0F2FF",
    border: "1px solid #1A2035",
  } as React.CSSProperties;

  const activeStyle = {
    background: `${accent}22`,
    color: accent,
    border: `1px solid ${accent}44`,
    fontWeight: 600,
  } as React.CSSProperties;

  function handlePage(p: number) {
    if (onPage) {
      onPage(p);
      window.scrollTo(0, 0);
    }
  }

  // Renders a single nav item as either an <a> link or a <button>
  function NavItem({
    targetPage,
    children,
    disabled = false,
    isActive = false,
    minW = false,
  }: {
    targetPage: number;
    children: React.ReactNode;
    disabled?: boolean;
    isActive?: boolean;
    minW?: boolean;
  }) {
    const cls = `px-3 py-1.5 rounded text-sm${minW ? " min-w-[36px] text-center" : ""}`;
    const style = isActive ? activeStyle : btnStyle;

    // <a> links for server pages (no onPage callback provided), buttons for client components
    if (!disabled && !onPage) {
      return (
        <a
          href={`?page=${targetPage}${filterSuffix}`}
          className={cls}
          style={style}
          aria-current={isActive ? "page" : undefined}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        onClick={!disabled ? () => handlePage(targetPage) : undefined}
        disabled={disabled}
        className={`${cls} disabled:opacity-30`}
        style={style}
        aria-current={isActive ? "page" : undefined}
      >
        {children}
      </button>
    );
  }

  const pageItems = getPageItems(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
      <NavItem targetPage={1} disabled={page === 1}>«</NavItem>
      <NavItem targetPage={page - 1} disabled={page === 1}>‹ Prev</NavItem>

      {pageItems.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm" style={{ color: "#7A8BA8" }}>
            …
          </span>
        ) : (
          <NavItem key={p} targetPage={p as number} isActive={page === p} minW>
            {p}
          </NavItem>
        ),
      )}

      <NavItem targetPage={page + 1} disabled={page === totalPages}>Next ›</NavItem>
      <NavItem targetPage={totalPages} disabled={page === totalPages}>»</NavItem>

      {total !== undefined && (
        <span className="text-sm w-full text-center mt-1.5" style={{ color: "#7A8BA8" }}>
          Page {page} of {totalPages} · {total.toLocaleString()} {countLabel}
        </span>
      )}
    </div>
  );
}
