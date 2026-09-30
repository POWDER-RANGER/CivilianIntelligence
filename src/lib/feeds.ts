import { createServerFn } from "@tanstack/react-start";

export type RegisterDoc = {
  title: string;
  html_url: string;
  publication_date: string;
  type: string;
  abstract?: string | null;
  agencies: { name: string }[];
};

export const getRegisterFeed = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url =
      "https://www.federalregister.gov/api/v1/documents.json?per_page=10&order=newest&fields[]=title&fields[]=html_url&fields[]=publication_date&fields[]=type&fields[]=abstract&fields[]=agencies";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`register ${res.status}`);
    const json = (await res.json()) as { results?: RegisterDoc[] };
    return { ok: true as const, results: json.results ?? [] };
  } catch {
    return { ok: false as const, results: [] as RegisterDoc[] };
  }
});
