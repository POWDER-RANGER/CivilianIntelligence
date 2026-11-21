const API_ORIGIN = "https://civintelligence.onrender.com";
const PATHS = new Set(["/api/civint/records/search", "/api/civint/sources"]);
export function validatePublicApiUrl(input) {
  const url = new URL(input);
  if (url.origin !== API_ORIGIN || !PATHS.has(url.pathname) || url.username || url.password || url.hash) {
    throw new Error("Native public API request rejected");
  }
  if (url.pathname.endsWith("/sources") && url.search) throw new Error("Unexpected source query");
  if (url.pathname.endsWith("/records/search") && [...url.searchParams.keys()].some(k => k !== "q" && k !== "limit")) {
    throw new Error("Unexpected record query");
  }
  return url.href;
}
export function createPublicApiTransport({browserFetch=fetch, nativeHttp=null}={}) {
  return async (input, options={}) => {
    const url=validatePublicApiUrl(input);
    if(options.method && options.method !== "GET") throw new Error("Public API is read-only");
    if(options.credentials && options.credentials !== "omit") throw new Error("Credentials forbidden");
    if(options.signal?.aborted) throw new DOMException("Cancelled","AbortError");
    if(!nativeHttp) return browserFetch(url,{...options,method:"GET",credentials:"omit"});
    const result=await nativeHttp.get({url,headers:{Accept:"application/json"},connectTimeout:6500,readTimeout:10000});
    if(options.signal?.aborted) throw new DOMException("Cancelled","AbortError");
    const data=typeof result.data==="string"?JSON.parse(result.data):result.data;
    return {ok:result.status>=200 && result.status<300,status:result.status,json:async()=>data};
  };
}
export async function platformPublicApiTransport() {
  if(typeof window!=="undefined" && window.Capacitor?.isNativePlatform?.()) {
    const {CapacitorHttp}=await import("@capacitor/core");
    return createPublicApiTransport({nativeHttp:CapacitorHttp});
  }
  return createPublicApiTransport();
}
