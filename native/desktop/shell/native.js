import {safeRecord, saveCache, findCached, clearCache, readCache} from "./offline-records.mjs";
const ORIGIN = "https://civintelligence.onrender.com";
const SECTIONS = Object.freeze({
  watchtower: ["Watchtower", "Situational awareness", "Monitor public intelligence and location-aware reporting.", "/"],
  records: ["Public records", "Document discovery", "Explore public records and source-linked documents.", "/records"],
  oversight: ["Oversight", "Accountability intelligence", "Review public oversight and accountability resources.", "/oversight"],
  globe: ["Global view", "Geographic context", "Open the interactive geographic view in the web workspace.", "/globe"],
  sources: ["Sources", "Evidence provenance", "Browse the public information sources powering CIVWATCH.", "/sources"]
});
const byId = (id) => document.getElementById(id);
let catalog = [];
let healthBySource = new Map();
let healthRequest;
function renderSources() {
  const list = byId("source-list");
  list.replaceChildren();
  const query = byId("source-search").value.trim().toLowerCase();
  const matches = catalog.filter(s => [s.name, s.category, s.attribution, s.nativeSurface].some(v => v.toLowerCase().includes(query)));
  for (const source of matches) {
    const article = document.createElement("article");
    article.className = "source-card";
    const heading = document.createElement("h3");
    heading.textContent = source.name;
    const detail = document.createElement("p");
    detail.textContent = source.category + " · " + source.attribution + " · " + source.cadence;
    const link = document.createElement("a");
    link.href = source.endpoint;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open original source";
    link.setAttribute("aria-label", "Open " + source.name + " in external browser");
    const health = healthBySource.get(source.name);
    if (health) {
      const status = document.createElement("p");
      status.className = "source-health";
      status.textContent = health === "reachable" ? "Source responded at last check" : "Source did not respond at last check";
      article.append(status);
    }
    article.append(heading, detail, link);
    list.append(article);
  }
  byId("source-count").textContent = matches.length + " of " + catalog.length + " catalogued sources";
}
async function loadCatalog() {
  try {
    const response = await fetch("./source-catalog.json", {cache: "no-store", credentials: "omit"});
    if (!response.ok) throw new Error("Catalog HTTP " + response.status);
    const data = await response.json();
    if (data.schema !== 1 || !Array.isArray(data.sources)) throw new Error("Invalid catalog");
    catalog = data.sources.filter(s => typeof s.name === "string" && typeof s.category === "string" &&
      typeof s.attribution === "string" && typeof s.cadence === "string" && typeof s.nativeSurface === "string" &&
      typeof s.endpoint === "string" && (() => { try { const u = new URL(s.endpoint); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; } })());
    renderSources();
  } catch {
    byId("source-count").textContent = "Bundled source catalog unavailable";
  }
}
function render() {
  const key = location.hash.slice(1);
  const selected = Object.hasOwn(SECTIONS, key) ? key : "watchtower";
  const [heading, description, detail, path] = SECTIONS[selected];
  byId("heading").textContent = heading;
  byId("description").textContent = description;
  byId("workspace-detail").textContent = detail;
  byId("open-web").href = ORIGIN + path;
  byId("sources-panel").hidden = selected !== "sources";
  byId("react-workspace").hidden = selected !== "watchtower";
  byId("records-panel").hidden = selected !== "records";
  for (const link of document.querySelectorAll("[data-route]")) {
    if (link.dataset.route === selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}
async function checkConnection() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  byId("connection-message").textContent = "Checking service availability…";
  try {
    const response = await fetch(ORIGIN + "/robots.txt", {
      method: "GET", mode: "cors", credentials: "omit", cache: "no-store", signal: controller.signal
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    byId("network").textContent = "Service reachable";
    byId("connection-message").textContent = "Public service responded. Native API access and sign-in are not yet enabled.";
  } catch {
    byId("network").textContent = navigator.onLine ? "Service unverified" : "Offline";
    byId("connection-message").textContent = "Service access could not be verified from this device. The local workspace remains available. The web service may be online but disallow cross-origin requests.";
  } finally { clearTimeout(timeout); }
}
window.addEventListener("hashchange", render);
window.addEventListener("online", checkConnection);
window.addEventListener("offline", checkConnection);
byId("retry").addEventListener("click", checkConnection);
byId("source-search").addEventListener("input", renderSources);
render();
loadCatalog();
checkConnection();

// Render only validated public fields using textContent; never inject HTML.
function renderRecordResults(records) {
  const list = byId("record-list");
  list.replaceChildren();
  for (const item of records) {
    const article = document.createElement("article");
    article.className = "source-card";
    const title = document.createElement("h3");
    title.textContent = item.title;
    const meta = document.createElement("p");
    meta.textContent = [item.agency, item.kind, item.publishedAt].filter(Boolean).join(" / ");
    const link = document.createElement("a");
    link.href = item.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View original record";
    article.append(title, meta, link);
    list.append(article);
  }
}
function updateOfflineCount() {
  byId("offline-count").textContent = readCache(localStorage).length + " saved public searches (24-hour retention).";
}
byId("clear-offline").addEventListener("click", () => {
  const ok = clearCache(localStorage);
  updateOfflineCount();
  byId("record-status").textContent = ok ? "Saved public searches cleared." : "Unable to clear local storage.";
});
updateOfflineCount();

// Public read-only API; never send cookies, bearer tokens, or local credentials.
let recordRequest;
async function searchRecords(event) {
  event.preventDefault();
  if (recordRequest) recordRequest.abort();
  const query = byId("record-query").value.trim();
  const list = byId("record-list");
  list.replaceChildren();
  if (!query) {
    byId("record-status").textContent = "Enter a query to search the public index.";
    return;
  }
  recordRequest = new AbortController();
  const current = recordRequest;
  const timeout = setTimeout(() => current.abort(), 10000);
  byId("record-status").textContent = "Searching public records...";
  try {
    const url = new URL("/api/civint/records/search", ORIGIN);
    url.searchParams.set("q", query.slice(0, 160));
    url.searchParams.set("limit", "20");
    const response = await fetch(url.href, {
      method: "GET", mode: "cors", credentials: "omit", cache: "no-store",
      headers: { Accept: "application/json" }, signal: current.signal
    });
    if (!response.ok) throw new Error("Public index HTTP " + response.status);
    const data = await response.json();
    if (data.state !== "available" || !Array.isArray(data.results)) throw new Error("Invalid index response");
    if (current !== recordRequest) return;
    const records = data.results.slice(0, 20).map(safeRecord).filter(Boolean);
    renderRecordResults(records);
    const stored = saveCache(localStorage, query, records);
    updateOfflineCount();
    byId("record-status").textContent = records.length + " live public records shown." +
      (stored ? " Saved for offline reference (up to 24 hours)." : " Offline storage unavailable.");
    } catch (error) {
    if (current !== recordRequest) return;
    const cached = findCached(localStorage, query);
    if (cached) {
      renderRecordResults(cached.records);
      byId("record-status").textContent = "Offline fallback: " + cached.records.length +
        " saved public records from " + new Date(cached.savedAt).toLocaleString() +
        ". These results may be outdated; verify against the original source.";
    } else {
      byId("record-status").textContent = navigator.onLine
        ? "Public index unavailable or cross-origin access blocked. No saved results for this query."
        : "Offline. No saved results for this query.";
    }
  } finally {
    clearTimeout(timeout);
  }
}
byId("record-form").addEventListener("submit", searchRecords);


// Optional read-only server-side source checks. No keys or cookies leave the device.
// A failed check never erases the independently bundled source directory.
async function refreshSourceHealth() {
  if (healthRequest) healthRequest.abort();
  const controller = new AbortController();
  healthRequest = controller;
  const timeout = setTimeout(() => controller.abort(), 12000);
  byId("source-refresh").disabled = true;
  byId("source-health-status").textContent = "Checking live source availability…";
  try {
    const response = await fetch(ORIGIN + "/api/civint/sources", {
      method: "GET", mode: "cors", credentials: "omit", cache: "no-store",
      headers: { Accept: "application/json" }, signal: controller.signal
    });
    if (!response.ok) throw new Error("Source status HTTP " + response.status);
    const data = await response.json();
    if (!Array.isArray(data.sources) || data.sources.length > 200) throw new Error("Invalid source status response");
    if (healthRequest !== controller) return;
    const next = new Map();
    for (const entry of data.sources) {
      if (!entry || !entry.source || typeof entry.source.name !== "string") continue;
      if (entry.state !== "reachable" && entry.state !== "unavailable") continue;
      next.set(entry.source.name, entry.state);
    }
    healthBySource = next;
    renderSources();
    byId("source-health-status").textContent = next.size + " sources checked by the server. A failed probe does not establish permanent unavailability.";
  } catch {
    if (healthRequest !== controller) return;
    byId("source-health-status").textContent = "Live status unavailable. The bundled source directory remains accessible.";
  } finally {
    clearTimeout(timeout);
    if (healthRequest === controller) byId("source-refresh").disabled = false;
  }
}
byId("source-refresh").addEventListener("click", refreshSourceHealth);
