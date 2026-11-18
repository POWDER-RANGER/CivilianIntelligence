export function assessDeployDrift(branchSha, deploys) {
  if (!/^[a-f0-9]{40}$/i.test(branchSha ?? "")) throw new Error("expected a full 40-character branch SHA");
  const live = deploys.find((deploy) => deploy.status === "live");
  if (!live) return { ok: false, reason: "no live Render deployment" };
  const liveSha = live.commit?.id;
  if (!/^[a-f0-9]{40}$/i.test(liveSha ?? "")) return { ok: false, reason: "live deployment has no valid commit SHA" };
  return liveSha.toLowerCase() === branchSha.toLowerCase()
    ? { ok: true, liveSha }
    : { ok: false, reason: "Render live commit differs from deployment branch", liveSha, branchSha };
}
