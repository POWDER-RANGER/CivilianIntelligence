import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/toolkit")({ component: ToolkitPage });

type TemplateId = "foia" | "privacy" | "state";

const TEMPLATES: Record<TemplateId, { label: string; cite: string; intro: string }> = {
  foia: {
    label: "Federal FOIA",
    cite: "5 U.S.C. § 552",
    intro:
      "Pursuant to the Freedom of Information Act, 5 U.S.C. § 552, I request copies of the following records:",
  },
  privacy: {
    label: "Privacy Act (first-party)",
    cite: "5 U.S.C. § 552a",
    intro:
      "Pursuant to the Privacy Act of 1974, 5 U.S.C. § 552a, and the Freedom of Information Act, I request access to any records about me maintained by your agency:",
  },
  state: {
    label: "State public records",
    cite: "applicable state public-records statute",
    intro:
      "Pursuant to the applicable state public-records law, I request copies of the following records:",
  },
};

const AGENCIES = [
  { name: "Department of Justice", foia: "https://www.justice.gov/oip" },
  { name: "Federal Bureau of Investigation", foia: "https://www.fbi.gov/foia-records" },
  { name: "Department of Homeland Security", foia: "https://www.dhs.gov/foia" },
  { name: "Department of Defense", foia: "https://www.foia.defense.gov/" },
  { name: "Department of Health and Human Services", foia: "https://www.hhs.gov/foia" },
  { name: "Internal Revenue Service", foia: "https://www.irs.gov/foia" },
  { name: "Department of State", foia: "https://www.state.gov/foia-requests" },
  { name: "Environmental Protection Agency", foia: "https://www.epa.gov/foia" },
  { name: "Federal Trade Commission", foia: "https://www.ftc.gov/foia" },
  { name: "Any agency — FOIA.gov directory", foia: "https://www.foia.gov/agency-directory.html" },
];

const LOOKUPS = [
  { name: "Find your representative", url: "https://www.house.gov/representatives", what: "House directory by state and district." },
  { name: "Senate directory", url: "https://www.senate.gov/senators/index.htm", what: "Senators, committees, and contact pages." },
  { name: "USA.gov elected officials", url: "https://www.usa.gov/elected-officials", what: "Federal, state, and local officials by address." },
  { name: "FOIA request status", url: "https://www.foia.gov/", what: "Submit and track federal records requests." },
  { name: "Oversight.gov", url: "https://www.oversight.gov/", what: "Inspector General reports across government." },
  { name: "GAO reports", url: "https://www.gao.gov/reports-testimonies", what: "Congressional audit and investigation archive." },
  { name: "MuckRock", url: "https://www.muckrock.com/", what: "File and publish records requests with a community." },
  { name: "RCFP legal guide", url: "https://www.rcfp.org/", what: "Free legal help for records and newsgathering." },
];

function ToolkitPage() {
  const [template, setTemplate] = useState<TemplateId>("foia");
  const [requester, setRequester] = useState("");
  const [agency, setAgency] = useState(AGENCIES[0].name);
  const [description, setDescription] = useState("");
  const [feeWaiver, setFeeWaiver] = useState(true);
  const [expedited, setExpedited] = useState(false);
  const [copied, setCopied] = useState(false);

  const letter = useMemo(() => {
    const t = TEMPLATES[template];
    const lines: string[] = [];
    lines.push(`To: Office of FOIA Services, ${agency}`);
    lines.push("");
    lines.push(`Re: Records request — ${t.cite}`);
    lines.push("");
    lines.push(`${t.intro}`);
    lines.push("");
    lines.push(
      description.trim()
        ? description.trim()
        : "[Describe the records here — be specific: dates, programs, offices, and formats. A description of what you want, not why you want it, is what the statute asks for.]",
    );
    lines.push("");
    if (template !== "state") {
      if (expedited) {
        lines.push(
          "I request expedited processing under 5 U.S.C. § 552(a)(6)(E) because there is an urgent need to inform the public about an actual or alleged federal government activity, and I am primarily engaged in disseminating information to the public.",
        );
        lines.push("");
      }
      if (feeWaiver) {
        lines.push(
          "I request a waiver of fees under 5 U.S.C. § 552(a)(4)(A)(ii)(II) because disclosure is in the public interest: it is likely to contribute significantly to public understanding of government operations, and is not primarily in my commercial interest.",
        );
        lines.push("");
      }
      lines.push("I request copies in electronic form, since the records are reasonably likely to be maintained electronically.");
      lines.push("");
    } else {
      lines.push("I request copies in electronic form where the records are maintained electronically.");
      lines.push("");
    }
    lines.push(
      requester.trim()
        ? `If any portion of this request is denied, please cite the specific exemption relied upon and release all reasonably segregable portions. Please also state the basis for any fee estimate above the statutory minimum before processing.`
        : `If any portion of this request is denied, please cite the specific exemption relied upon and release all reasonably segregable portions.`,
    );
    lines.push("");
    lines.push("Thank you,");
    lines.push(requester.trim() || "[Your name, mailing address, email, and phone]");
    return lines.join("\n");
  }, [template, requester, agency, description, feeWaiver, expedited]);

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Desk 05</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Field toolkit</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Intelligence is a skill, not a feed. Draft a records request, find who represents you, and read the
          audits — the same moves a professional desk makes, with the same public tools.
        </p>

        <h2 className="mt-8 font-display text-2xl">Records request generator</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
                <Button
                  key={id}
                  variant={template === id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTemplate(id)}
                  className="font-mono text-[11px] uppercase tracking-wider"
                >
                  {TEMPLATES[id].label}
                </Button>
              ))}
            </div>
            <label className="grid gap-1.5 text-xs text-muted-foreground">
              Your name / signature block
              <Input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Full name, address, email" />
            </label>
            <label className="grid gap-1.5 text-xs text-muted-foreground">
              Agency
              <select
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
              >
                {AGENCIES.map((a) => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs text-muted-foreground">
              Records you want
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="All contracts, task orders, and modifications with commercial data brokers for location data, FY2024-present"
                className="w-full rounded-md border border-border bg-card p-3 text-sm text-foreground"
              />
            </label>
            {template !== "state" && (
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={feeWaiver} onChange={(e) => setFeeWaiver(e.target.checked)} />
                  Fee waiver request
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={expedited} onChange={(e) => setExpedited(e.target.checked)} />
                  Expedited processing
                </label>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Draft — {TEMPLATES[template].cite}
              </p>
              <Button size="sm" onClick={copyLetter} className="font-mono text-[11px] uppercase tracking-wider">
                {copied ? "Copied" : "Copy letter"}
              </Button>
            </div>
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-card p-4 font-mono text-[12px] leading-relaxed text-foreground">
              {letter}
            </pre>
            <p className="text-[11px] leading-snug text-muted-foreground">
              This draft is a starting point, not legal advice. Mail it to the agency FOIA office or file via
              FOIA.gov, and keep a copy of everything you send.
            </p>
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl">Agency FOIA offices</h2>
        <div className="mt-4 grid gap-px border border-border bg-border md:grid-cols-2">
          {AGENCIES.map((a) => (
            <a key={a.name} href={a.foia} target="_blank" rel="noopener noreferrer" className="bg-card p-3 text-sm hover:bg-muted/60">
              {a.name}
            </a>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl">Look it up</h2>
        <div className="mt-4 grid gap-px border border-border bg-border md:grid-cols-2">
          {LOOKUPS.map((l) => (
            <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="group bg-card p-4 hover:bg-muted/60">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium group-hover:underline">{l.name}</p>
                <Badge variant="outline">Open</Badge>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{l.what}</p>
            </a>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl">Field rules</h2>
        <div className="mt-4 grid gap-px border border-border bg-border md:grid-cols-3">
          {[
            ["Ask for records, not answers", "Agencies disclose documents. Describe the record — system, dates, office — not the conclusion you want."],
            ["One thread, everything in writing", "Phone calls are background. The request, the acknowledgment, the appeal — all in writing."],
            ["Appeal early", "A denial is the first step, not the last. Most denials get narrowed or reversed on appeal."],
          ].map(([title, body]) => (
            <div key={title} className="bg-card p-4">
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
