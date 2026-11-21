import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, ArrowRight, Search, X } from "lucide-react";
import { GUIDE_DISCLAIMER, guideSuggestions } from "@/lib/navigator-guide";

const STARTERS = [
  "Show me mapped cameras",
  "Find federal contracts",
  "How do I file a FOIA request?",
] as const;

/**
 * Read-only assistant foundation. Prompts stay in the browser until a user
 * explicitly opens an indexed-record search. No model or telemetry is called.
 */
export function NavigatorGuide() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = guideSuggestions(question);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function ask(value: string) {
    const cleaned = value.trim().slice(0, 200);
    setPrompt(cleaned);
    setQuestion(cleaned);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(prompt);
  }

  return (
    <aside className="fixed bottom-4 right-3 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <section
          id="civwatch-guide"
          role="region"
          aria-label="CIVWATCH guidance assistant"
          className="mb-3 flex max-h-[min(72dvh,36rem)] w-[min(25rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border p-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold"><Bot className="size-4" /> CIVWATCH Guide</h2>
              <p className="mt-1 text-xs text-muted-foreground">Assisted navigation · Read-only</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close guide" className="rounded-md p-1 hover:bg-muted">
              <X className="size-5" />
            </button>
          </header>
          <div className="space-y-4 overflow-y-auto p-4">
            <p className="text-sm">Tell me what you want to investigate. I will suggest the relevant desk or record search.</p>
            <form onSubmit={submit} className="flex gap-2">
              <input
                ref={inputRef}
                aria-label="Ask CIVWATCH Guide"
                maxLength={200}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Find cameras, contracts, FOIA..."
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button type="submit" disabled={!prompt.trim()} aria-label="Find guidance" className="rounded-md bg-primary px-3 text-primary-foreground disabled:opacity-50">
                <Search className="size-4" />
              </button>
            </form>
            {!question ? (
              <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
                {STARTERS.map((starter) => (
                  <button key={starter} type="button" onClick={() => ask(starter)} className="rounded-full border border-border px-3 py-2 text-left text-xs hover:bg-muted">
                    {starter}
                  </button>
                ))}
              </div>
            ) : (
              <div aria-live="polite" className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {suggestions.length ? "Suggested destinations" : "No direct desk match"}
                </p>
                {suggestions.length === 0 && (
                  <p className="text-sm text-muted-foreground">I cannot determine the right desk from this request. Search the public record index instead.</p>
                )}
                {suggestions.map((destination) => (
                  <Link
                    key={destination.to}
                    to={destination.to}
                    onClick={() => setOpen(false)}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{destination.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{destination.detail}</span>
                    </span>
                    <ArrowRight className="mt-1 size-4 shrink-0" />
                  </Link>
                ))}
                <Link to="/records" search={{ q: question }} onClick={() => setOpen(false)} className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-2">
                  Search indexed records for this question <ArrowRight className="size-3" />
                </Link>
              </div>
            )}
            <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">{GUIDE_DISCLAIMER}</p>
          </div>
        </section>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="civwatch-guide"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex min-h-11 items-center gap-2 rounded-full border border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg"
      >
        <Bot className="size-4" /> {open ? "Close guide" : "Ask CIVWATCH"}
      </button>
    </aside>
  );
}
