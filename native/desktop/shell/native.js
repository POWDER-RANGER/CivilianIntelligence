const ORIGIN = "https://civintelligence.onrender.com";
const SECTIONS = Object.freeze({
  watchtower: ["Watchtower", "Situational awareness", "Monitor public intelligence and location-aware reporting.", "/"],
  records: ["Public records", "Document discovery", "Explore public records and source-linked documents.", "/records"],
  oversight: ["Oversight", "Accountability intelligence", "Review public oversight and accountability resources.", "/oversight"],
  globe: ["Global view", "Geographic context", "Open the interactive geographic view in the web workspace.", "/globe"],
  sources: ["Sources", "Evidence provenance", "Browse the public information sources powering CIVWATCH.", "/sources"]
});
const byId = (id) => document.getElementById(id);
function render() {
  const key = location.hash.slice(1);
  const selected = Object.hasOwn(SECTIONS, key) ? key : "watchtower";
  const [heading, description, detail, path] = SECTIONS[selected];
  byId("heading").textContent = heading;
  byId("description").textContent = description;
  byId("workspace-detail").textContent = detail;
  byId("open-web").href = ORIGIN + path;
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
    // A no-credentials probe only. The server must explicitly authorize this
    // origin via CORS before the local WebView can access its JSON APIs.
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
render();
checkConnection();