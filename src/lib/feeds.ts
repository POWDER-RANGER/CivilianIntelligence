import { createServerFn } from "@tanstack/react-start";
import { collapseRegisterDuplicates } from "./register-collapse";

export { collapseRegisterDuplicates };

export type RegisterDoc = {
  title: string;
  html_url: string;
  publication_date: string;
  type: string;
  abstract?: string | null;
  agencies: { name: string }[];
  /** Same-day documents with an identical title and type, collapsed into this entry. */
  duplicateCount?: number;
};


export const getRegisterFeed = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url =
      "https://www.federalregister.gov/api/v1/documents.json?per_page=25&order=newest&fields[]=title&fields[]=html_url&fields[]=publication_date&fields[]=type&fields[]=abstract&fields[]=agencies";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`register ${res.status}`);
    const json = (await res.json()) as { results?: RegisterDoc[] };
    return { ok: true as const, results: collapseRegisterDuplicates(json.results ?? []).slice(0, 10) };
  } catch {
    return { ok: false as const, results: [] as RegisterDoc[] };
  }
});
