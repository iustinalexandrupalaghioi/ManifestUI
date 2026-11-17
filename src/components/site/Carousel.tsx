"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

/**
 * A horizontal carousel built on CSS scroll-snap: swipe on touch, arrows on
 * desktop, keyboard-scrollable, no library. Its children are the slides (they
 * can come from a <List>, which adds no wrapper elements). In the page editor
 * (`edit`) it becomes a grid, so every slide can be edited without scrolling.
 */
export function Carousel({ children, edit = false, label }: { children: ReactNode; edit?: boolean; label?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) =>
    track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: "smooth" });

  if (edit) return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>;

  const arrow =
    "flex size-11 items-center justify-center rounded-full border bg-background text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary";
  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="flex flex-col gap-4">
      <div
        ref={track}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 outline-none [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden [&>*]:w-[85%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[45%] lg:[&>*]:w-[31%]"
      >
        {children}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className={arrow}>
          <ChevronLeftIcon className="size-5" aria-hidden />
        </button>
        <button type="button" aria-label="Next" onClick={() => scroll(1)} className={arrow}>
          <ChevronRightIcon className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
