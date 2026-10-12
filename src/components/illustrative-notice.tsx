import { FlaskConical } from "lucide-react";

/**
 * Evidence-first labeling for curated example content (live audit P0-5).
 *
 * Curated fixtures in `src/data/desks.ts` illustrate what a desk will show once
 * its feed adapter exists. They are not retrieved records, so they must never
 * carry LIVE / ALERT styling or read as current events.
 */
export function IllustrativeNotice({ feed }: { feed: string }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-dashed border-amber-400/60 bg-amber-50/60 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-semibold">Illustrative examples — not live records.</strong>{" "}
        These entries show the shape of the {feed} feed. They were written by hand,
        are not retrieved from a source, and their dates and statuses are not
        current. Use the linked source to check what is actually published.
      </p>
    </div>
  );
}

export function ExampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-amber-500/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
      Example
    </span>
  );
}
