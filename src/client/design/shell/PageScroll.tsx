import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

/**
 * Scrolls the page and keeps its place. When a tab, filter or loading state
 * makes the page shorter, the browser would pull the reader up to fit; an
 * invisible strip keeps the part already scrolled to reachable.
 */
export function PageScroll({ children }: { children: ReactNode }) {
  const strip = useRef<HTMLDivElement>(null);
  const pathname = useLocation({ select: (location) => location.pathname });
  const hold = (height: number) => {
    if (strip.current) strip.current.style.height = `${height}px`;
  };
  useLayoutEffect(() => hold(0), [pathname]);
  return (
    <div
      className="relative min-h-0 min-w-0 flex-1 overflow-auto [scrollbar-gutter:stable_both-edges]"
      onScroll={({ target, currentTarget }) => {
        if (target !== currentTarget) return;
        const { scrollTop, clientHeight } = currentTarget;
        hold(scrollTop > 0 ? Math.floor(scrollTop + clientHeight) : 0);
      }}
    >
      {children}
      <div
        ref={strip}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 w-px"
      />
    </div>
  );
}
