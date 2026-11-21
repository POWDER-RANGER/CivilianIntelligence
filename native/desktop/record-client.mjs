import {platformPublicApiTransport} from "./public-api-transport.mjs";
import {safeRecord, saveCache, findCached, normalizeQuery} from "./shell/offline-records.mjs";

export const RECORD_ENDPOINT = "https://civintelligence.onrender.com/api/civint/records/search";
export function parseRecordResponse(data) {
  if (!data || !Array.isArray(data.results) || data.results.length > 100) throw new Error("Invalid public index response");
  return data.results.slice(0, 20).map(safeRecord).filter(Boolean);
}
export async function searchPublicRecords(query, {fetcher=fetch, storage=localStorage, signal}={}) {
  const key=normalizeQuery(query);
  if (!key) throw new Error("Search query required");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  const abort=()=>controller.abort();
  signal?.addEventListener("abort",abort,{once:true});
  try {
    if(signal?.aborted) throw new Error("Search cancelled");
    const url=new URL(RECORD_ENDPOINT);
    url.searchParams.set("q",key);
    url.searchParams.set("limit","20");
    const transport=fetcher===fetch ? await platformPublicApiTransport() : fetcher;
    const response=await transport(url.href,{method:"GET",mode:"cors",credentials:"omit",cache:"no-store",headers:{Accept:"application/json"},signal:controller.signal});
    if(!response.ok) throw new Error("Public index unavailable");
    const records=parseRecordResponse(await response.json());
    if(controller.signal.aborted) throw new Error("Search cancelled");
    const saved=saveCache(storage,key,records);
    return {records,source:"live",saved,query:key};
  } catch(error) {
    if(signal?.aborted) throw error;
    const cached=findCached(storage,key);
    if(cached) return {records:cached.records,source:"cache",savedAt:cached.savedAt,query:key};
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort",abort);
  }
}
