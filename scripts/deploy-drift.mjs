export function assessDeployDrift(branchSha, deploys) {
  if (!/^[a-f0-9]{40}$/i.test(branchSha ?? "")) throw new Error("expected a full 40-character branch SHA");
  if (!Array.isArray(deploys)) return { ok: false, reason: "invalid Render deployment response" };
  const liveDeploys = deploys.filter((deploy) => deploy && deploy.status === "live");
  if (liveDeploys.length === 0) return { ok: false, reason: "no live Render deployment" };
  if (liveDeploys.length !== 1) return { ok: false, reason: "ambiguous multiple live Render deployments" };
  const liveSha = liveDeploys[0].commit?.id;
  if (!/^[a-f0-9]{40}$/i.test(liveSha ?? "")) return { ok: false, reason: "live deployment has no valid commit SHA" };
  return liveSha.toLowerCase() === branchSha.toLowerCase()
    ? { ok: true, liveSha }
    : { ok: false, reason: "Render live commit differs from deployment branch", liveSha, branchSha };
}
