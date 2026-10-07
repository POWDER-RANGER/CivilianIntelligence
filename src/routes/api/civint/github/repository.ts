import { createFileRoute } from "@tanstack/react-router";

const GITHUB_API = "https://api.github.com";
const MANIFESTS = new Set(["package.json","package-lock.json","pnpm-lock.yaml","yarn.lock","requirements.txt","pyproject.toml","Cargo.toml","Cargo.lock","go.mod","Gemfile","Dockerfile"]);
function parseRepo(input: string) {
  const value = input.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git\/?$/, "").replace(/^\/+|\/+$/g, "");
  const parts = value.split("/").filter(Boolean);
  return parts.length === 2 && parts.every((part) => /^[A-Za-z0-9_.-]+$/.test(part)) ? { owner: parts[0], repo: parts[1] } : null;
}
async function gh(path: string) {
  const response = await fetch(GITHUB_API + path, { headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "CIVINTELLIGENCE-Reading-Room" }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("GitHub returned " + response.status);
  return response.json();
}
async function readFile(owner: string, repo: string, path: string) {
  try {
    const value = await gh("/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "/contents/" + path.split("/").map(encodeURIComponent).join("/")) as { type?: string; content?: string; path?: string };
    if (value.type !== "file" || !value.content) return null;
    return { path: value.path ?? path, content: Buffer.from(value.content.replace(/\n/g, ""), "base64").toString("utf8") };
  } catch { return null; }
}
function signals(files: Array<{content: string}>) {
  const all = files.map((file) => file.content).join("\n");
  const out: Array<{level: "review"|"caution"; title: string; detail: string}> = [];
  if (/curl\s+[^\n|]+\|\s*(ba)?sh\b|wget\s+[^\n|]+\|\s*(ba)?sh\b/i.test(all)) out.push({ level:"review", title:"Remote script execution pattern", detail:"A remote resource appears to be piped directly into a shell. Inspect it before execution." });
  if (/powershell[^\n]*(?:-enc|-encodedcommand)/i.test(all)) out.push({ level:"review", title:"Encoded PowerShell command", detail:"Encoded PowerShell makes command intent harder to inspect. Review the command before execution." });
  if (/\b(?:sudo|doas)\b/i.test(all)) out.push({ level:"review", title:"Elevated privileges requested", detail:"A command requests elevated privileges. Determine why and whether the access is necessary." });
  if (/(?:base64\s+(?:-d|--decode)|certutil\s+-decode|FromBase64String)/i.test(all)) out.push({ level:"review", title:"Encoded payload handling", detail:"The inspected files contain payload encoding or decoding patterns. Review the decoded material and destination." });
  if (/(?:npm|pnpm|yarn)\s+(?:install|add)\s+[^\n]*(?:https?:\/\/|git\+)/i.test(all)) out.push({ level:"caution", title:"External package source", detail:"A package command references a URL or Git repository directly. Inspect the dependency before installing it." });
  return out;
}
export const Route = createFileRoute("/api/civint/github/repository")({ server: { handlers: { GET: async ({ request }) => {
  const parsed = parseRepo(new URL(request.url).searchParams.get("repo") ?? "");
  if (!parsed) return Response.json({ message: "Enter a GitHub owner/repository or GitHub URL." }, { status:400 });
  try {
    const owner = encodeURIComponent(parsed.owner), repo = encodeURIComponent(parsed.repo);
    const root = await gh("/repos/" + owner + "/" + repo) as any;
    const raw = await gh("/repos/" + owner + "/" + repo + "/contents") as any[];
    const files = raw.filter((item) => item && typeof item.path === "string").map((item) => ({ path:String(item.path), type:item.type === "dir" ? "dir" : "file", size:typeof item.size === "number" ? item.size : undefined }));
    const readme = await readFile(parsed.owner, parsed.repo, "README.md");
    const manifestPaths = files.filter((item) => item.type === "file" && MANIFESTS.has(item.path.split("/").pop() ?? "")).slice(0,12).map((item) => item.path);
    const manifests = (await Promise.all(manifestPaths.map((path) => readFile(parsed.owner, parsed.repo, path)))).filter((item): item is {path:string;content:string} => item !== null);
    let workflowRaw:any[] = []; try { workflowRaw = await gh("/repos/" + owner + "/" + repo + "/contents/.github/workflows") as any[]; } catch { /* Workflow listings are optional for repositories without Actions. */ }
    const workflowPaths = workflowRaw.filter((item) => item?.type === "file" && typeof item.path === "string").slice(0,20).map((item) => item.path as string);
    const workflows = (await Promise.all(workflowPaths.map((path) => readFile(parsed.owner, parsed.repo, path)))).filter((item): item is {path:string;content:string} => item !== null);
    return Response.json({ repository:{ full_name:root.full_name, html_url:root.html_url, description:root.description ?? null, default_branch:root.default_branch, created_at:root.created_at, updated_at:root.updated_at, archived:Boolean(root.archived), fork:Boolean(root.fork), stargazers_count:Number(root.stargazers_count ?? 0), forks_count:Number(root.forks_count ?? 0), open_issues_count:Number(root.open_issues_count ?? 0), license:root.license?.spdx_id ?? root.license?.name ?? null }, readme:readme ? { path:readme.path, content:readme.content.slice(0,12000) } : null, files, workflows:workflows.map(({path})=>({path,type:"file"})), manifests:manifests.map(({path})=>({path,type:"file"})), signals:signals([...manifests,...workflows]), checked_at:new Date().toISOString() }, { headers:{"Cache-Control":"public, max-age=300, s-maxage=300, stale-while-revalidate=900"} });
  } catch (error) { return Response.json({ message:error instanceof Error ? error.message : "GitHub repository unavailable." }, { status:502 }); }
}}}});