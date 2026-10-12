// Accepts every form the Reading Room invites: "owner/repo", "github.com/owner/repo"
// (its own placeholder), "https://github.com/owner/repo", ".git" clone URLs, and
// deep links such as ".../tree/main/src". Live audit P1-8: the bare
// "github.com/owner/repo" form was rejected because the scheme was required.
export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const value = input
    .trim()
    .replace(/^git@github\.com:/i, "")
    .replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/^\/+|\/+$/g, "");
  const [owner, rawRepo] = value.split("/").filter(Boolean);
  const repo = rawRepo?.replace(/\.git$/i, "");
  if (!owner || !repo) return null;
  const valid = (part: string) => /^[A-Za-z0-9_.-]+$/.test(part) && part !== "." && part !== "..";
  return valid(owner) && valid(repo) ? { owner, repo } : null;
}
