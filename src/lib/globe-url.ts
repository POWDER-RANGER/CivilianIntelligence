// Builds links into the CIVWATCH Globe (a configured instance of the open-source
// gods-eye-view project). The globe reads its camera from the URL fragment, so
// centering on the viewer needs no change to the upstream service. Fragments are
// never sent in HTTP requests: the coordinates stay in the viewer's browser.

export const GLOBE_BASE_URL = "https://civintelligence-gods-eye-view.onrender.com";

/** Default camera: downtown Austin, TX, street level. */
export const DEFAULT_GLOBE_CAMERA = { lat: 30.2672, lon: -97.7431, alt: 600 } as const;

/** Altitude (m) used when centering on the viewer: neighborhood scale. */
export const MY_LOCATION_ALT = 1500;

/**
 * How much of the viewer's own tool UI is shown. The viewer reads these from the
 * URL fragment (`hud`, `hv`, `ui`), so no change to the upstream service is needed.
 * - hidden:  HUD off, every panel collapsed (clean map)
 * - minimal: compact HUD layout, every panel collapsed
 * - full:    tactical HUD with the default open panels
 */
export type GlobeToolsMode = "hidden" | "minimal" | "full";

export const DEFAULT_TOOLS_MODE: GlobeToolsMode = "minimal";

export const TOOLS_MODES: readonly GlobeToolsMode[] = ["hidden", "minimal", "full"];

export function isToolsMode(value: unknown): value is GlobeToolsMode {
  return typeof value === "string" && (TOOLS_MODES as readonly string[]).includes(value);
}

const PANEL_TOKENS = ["c", "l", "d", "v", "i", "t", "r", "s", "g", "p", "m"] as const;
const UNPINNABLE = new Set(["i", "m"]);

const COLLAPSED_PANELS = PANEL_TOKENS.map(
  (t) => `${t}.c.1${UNPINNABLE.has(t) ? "" : `_${t}.p.0`}`,
).join("_");

const FULL_PANELS = "c.c.1_c.p.0_l.c.1_l.p.0_d.c.1_v.c.1_i.c.0_t.c.1_r.c.1_s.c.1_g.c.1_p.c.1_m.c.0";

const VIEW_BASE =
  "heading=15&pitch=-30&roll=360&style=normal&bloom=0&sharpen=1&bi=0&bv=2&si=49";
// Only source-backed layers are enabled by default. Street Traffic animates
// simulated vehicle sprites (not observed positions) and is intentionally absent
// from the layer list; detection overlays start off.
const VIEW_LAYERS =
  "&dm=OFF&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=esri-imagery&l=e.f.j.y&lo=f.e.1_k.o.n";

function toolsState(mode: GlobeToolsMode): string {
  switch (mode) {
    case "hidden":
      return `&hud=minimal&hv=0&ui=${COLLAPSED_PANELS}`;
    case "minimal":
      return `&hud=minimal&hv=1&ui=${COLLAPSED_PANELS}`;
    default:
      return `&hud=tactical&hv=1&ui=${FULL_PANELS}`;
  }
}

export type GlobeCamera = { lat: number; lon: number; alt: number };

/** Round to 3 decimals (~110 m) so a precise fix is never written into a URL. */
export function coarsen(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function isValidCamera(camera: GlobeCamera): boolean {
  return (
    Number.isFinite(camera.lat) &&
    Number.isFinite(camera.lon) &&
    Number.isFinite(camera.alt) &&
    Math.abs(camera.lat) <= 90 &&
    Math.abs(camera.lon) <= 180 &&
    camera.alt > 0
  );
}

export function buildGlobeEmbedUrl(
  camera: GlobeCamera = DEFAULT_GLOBE_CAMERA,
  tools: GlobeToolsMode = DEFAULT_TOOLS_MODE,
  { embed = true }: { embed?: boolean } = {},
): string {
  const c = isValidCamera(camera) ? camera : DEFAULT_GLOBE_CAMERA;
  const lat = coarsen(c.lat);
  const lon = coarsen(c.lon);
  const alt = Math.round(c.alt);
  return `${GLOBE_BASE_URL}/${embed ? "?embed=1" : ""}#v=2&lat=${lat}&lon=${lon}&alt=${alt}&${VIEW_BASE}${toolsState(tools)}${VIEW_LAYERS}`;
}
