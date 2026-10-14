import { cn } from "@/lib/utils";

/**
 * CIVWATCH review-bracket mark (Design Standard v2). Two opposing corner
 * brackets frame a dot: the point under review. Brackets take the current
 * text color; only the dot may use the accent.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth={4.25} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 18.5V10.5a4 4 0 0 1 4-4h8" />
        <path d="M41.5 29.5v8a4 4 0 0 1-4 4h-8" />
      </g>
      <circle cx="24" cy="24" r="5" className="fill-primary" />
    </svg>
  );
}

/** Mark + wordmark lockup. Optional product name follows a vertical rule. */
export function BrandLockup({ product, className }: { product?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <BrandMark className="size-7" />
      <span className="text-[17px] font-semibold uppercase leading-none tracking-[0.06em]">CIVWATCH</span>
      {product ? (
        <>
          <span aria-hidden="true" className="h-4 w-px bg-foreground/70" />
          <span className="text-[17px] leading-none">{product}</span>
        </>
      ) : null}
    </span>
  );
}
