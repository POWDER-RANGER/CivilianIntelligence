import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = new Set([
  "www.cia.gov","cia.gov","vault.fbi.gov","fbi.gov","foia.state.gov",
  "www.dhs.gov","dhs.gov","www.nsa.gov","nsa.gov","www.dia.mil","dia.mil",
]);

function safeUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) return null;
    return url;
  } catch { return null; }
}

function decode(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#x27;/gi, "'").replace(/&#x2F;/gi, "/").replace(/\s+/g, " ").trim();
}

function stripHtml(html: string, baseUrl: URL) {
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ").trim();
  const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((m) => decode(m[1]))
    .filter(Boolean).slice(0, 20);
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => {
      try {
        const target = new URL(m[1], baseUrl);
        const safe = safeUrl(target.toString());
        if (!safe) return null;
        const label = decode(m[2]);
        if (!label) return null;
        return { label: label.slice(0, 160), url: safe.toString() };
      } catch { return null; }
    })
    .filter((link): link is { label: string; url: string } => Boolean(link))
    .filter((link, index, all) => all.findIndex((item) => item.url === link.url) === index)
    .slice(0, 40);
  return { title, text: text.slice(0, 16000), headings, links };
}

export const Route = createFileRoute("/api/civint/reading-room/source")({
  server: { handlers: { GET: async ({ request }) => {
    const url = new URL(request.url);
    const target = safeUrl(url.searchParams.get("url") ?? "");
    if (!target) return Response.json({ message: "Only approved federal reading-room sources can be opened inside CIVINT." }, { status: 400 });
    try {
      const response = await fetch(target, {
        headers: { Accept: "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.1", "User-Agent": "CIVINTELLIGENCE-Reading-Room/1.0" },
        signal: AbortSignal.timeout(12000),
        redirect: "follow",
      });
      const finalUrl = safeUrl(response.url);
      if (!finalUrl) return Response.json({ message: "The source redirected outside the approved reading-room network." }, { status: 502 });
      if (!response.ok) return Response.json({ message: "Source returned HTTP " + response.status }, { status: 502 });
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/pdf")) {
        const body = await response.arrayBuffer();
        if (body.byteLength > 10_000_000) return Response.json({ message: "Document exceeds the in-page reader limit." }, { status: 413 });
        return new Response(body, { headers: { "Content-Type": "application/pdf", "Cache-Control": "public, max-age=300, stale-while-revalidate=900", "Content-Disposition": "inline" } });
      }
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return Response.json({ message: "This source format is not supported by the in-page reader yet." }, { status: 415 });
      const contentLength = Number(response.headers.get("content-length") ?? "0");
      if (contentLength > 5_000_000) return Response.json({ message: "Source exceeds the in-page text reader limit." }, { status: 413 });
      const body = await response.text();
      if (body.length > 5_000_000) return Response.json({ message: "Source exceeds the in-page text reader limit." }, { status: 413 });
      const parsed = contentType.includes("text/html") ? stripHtml(body, finalUrl) : { title: finalUrl.pathname.split("/").pop() ?? finalUrl.hostname, text: body.slice(0, 16000), headings: [], links: [] };
      return Response.json({ source_url: finalUrl.toString(), fetched_at: new Date().toISOString(), content_type: contentType, ...parsed }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" } });
    } catch (error) {
      return Response.json({ message: error instanceof Error ? error.message : "Reading-room source unavailable." }, { status: 502 });
    }
  }}}});
