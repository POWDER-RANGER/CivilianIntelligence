import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {readCache} from "./shell/offline-records.mjs";
import {searchPublicRecords} from "./record-client.mjs";

type Source = {id:string;name:string;category:string;endpoint:string;attribution:string};
type Catalog = {schema:number;sources:Source[]};
type Status = "loading" | "ready" | "offline" | "error";
const API = "https://civintelligence.onrender.com";
const allowed = (url:string) => {try {const u=new URL(url);return u.protocol==="https:" && !u.username && !u.password;}catch{return false;}};
function useConnectivity() {
  const [online,setOnline] = useState(navigator.onLine);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine);window.addEventListener("online",update);window.addEventListener("offline",update);return ()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};},[]);
  return online;
}
function Workspace() {
  const [route,setRoute]=useState(()=>location.hash.slice(1)||"watchtower");
  useEffect(()=>{
    const update=(event:Event)=>setRoute((event as CustomEvent<string>).detail||"watchtower");
    const hash=()=>setRoute(location.hash.slice(1)||"watchtower");
    window.addEventListener("civint:route",update);
    window.addEventListener("hashchange",hash);
    return ()=>{window.removeEventListener("civint:route",update);window.removeEventListener("hashchange",hash);};
  },[]);
  const online=useConnectivity();
  const [sources,setSources]=useState<Source[]>([]);
  const [status,setStatus]=useState<Status>("loading");
  const [health,setHealth]=useState<Record<string,string>>({});
  const [healthStatus,setHealthStatus]=useState<Status>("offline");
  const [filter,setFilter]=useState("");
  const [refresh,setRefresh]=useState(0);
  const [saved,setSaved]=useState<ReturnType<typeof readCache>>([]);
  const [query,setQuery]=useState("");
  const [recordState,setRecordState]=useState<"idle"|"loading"|"live"|"cache"|"error">("idle");
  const [records,setRecords]=useState<Array<{title:string;sourceUrl:string;agency?:string;kind?:string}>>([]);
  const [recordMessage,setRecordMessage]=useState("Search the public index or recover a saved query.");
  useEffect(()=>{
    const refreshSaved=()=>{try{setSaved(readCache(localStorage));}catch{setSaved([]);}};
    window.addEventListener("storage",refreshSaved);
    window.addEventListener("civint:records-updated",refreshSaved);
    return ()=>{window.removeEventListener("storage",refreshSaved);window.removeEventListener("civint:records-updated",refreshSaved);};
  },[]);
  const searchController=React.useRef<AbortController|null>(null);
  useEffect(()=>()=>searchController.current?.abort(),[]);
  async function search(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchController.current?.abort();
    const controller=new AbortController();
    searchController.current=controller;
    setRecordState("loading");
    setRecordMessage("Searching public records…");
    try {
      const result=await searchPublicRecords(query,{signal:controller.signal});
      if(controller.signal.aborted)return;
      setRecords(result.records);
      setRecordState(result.source);
      setRecordMessage(result.source==="cache"
        ? "Offline fallback: saved results from "+new Date(result.savedAt).toLocaleString()+". Verify before acting."
        : result.records.length+" live records. "+(result.saved?"Saved for offline reference.":"Local storage unavailable."));
      setRefresh(v=>v+1);
    } catch {
      if(controller.signal.aborted)return;
      setRecords([]);
      setRecordState("error");
      setRecordMessage("Public index unavailable and no matching saved results found.");
    }
  }
  useEffect(()=>{
    let active=true;
    fetch("./source-catalog.json",{credentials:"omit"}).then(async response=>{
      if(!response.ok) throw Error("catalog");
      const body=await response.json() as Catalog;
      if(body.schema!==1 || !Array.isArray(body.sources)) throw Error("catalog schema");
      const entries=body.sources.filter(s=>s && typeof s.id==="string" && typeof s.name==="string" && typeof s.category==="string" && typeof s.attribution==="string" && typeof s.endpoint==="string" && allowed(s.endpoint));
      if(active){setSources(entries);setStatus("ready");}
    }).catch(()=>{if(active)setStatus("error");});
    return ()=>{active=false;};
  },[]);
  useEffect(()=>{try{setSaved(readCache(localStorage));}catch{setSaved([]);}},[refresh]);
  useEffect(()=>{
    if(!online){setHealthStatus("offline");return;}
    const abort=new AbortController();
    const timeout=setTimeout(()=>abort.abort(),10000);
    setHealthStatus("loading");
    fetch(API+"/api/civint/sources",{method:"GET",credentials:"omit",cache:"no-store",signal:abort.signal,headers:{Accept:"application/json"}})
      .then(async r=>{if(!r.ok)throw Error("source health");return r.json();})
      .then(data=>{
        if(abort.signal.aborted)return;
        if(!Array.isArray(data.sources) || data.sources.length>200)throw Error("invalid response");
        const next:Record<string,string>={};
        for(const item of data.sources) if(item?.source && typeof item.source.name==="string" && (item.state==="reachable" || item.state==="unavailable")) next[item.source.name]=item.state;
        setHealth(next);setHealthStatus("ready");
      }).catch(()=>{if(!abort.signal.aborted)setHealthStatus("error");})
      .finally(()=>clearTimeout(timeout));
    return ()=>{abort.abort();clearTimeout(timeout);};
  },[online,refresh]);
  const filtered=useMemo(()=>sources.filter(s=>[s.name,s.category,s.attribution].some(v=>v.toLowerCase().includes(filter.trim().toLowerCase()))),[sources,filter]);
  return <section aria-label="Native intelligence overview" className="react-workspace">
    <div className="workspace-heading"><div><p className="eyebrow">LOCAL INTELLIGENCE DESK</p><h2>{route==="records"?"Public record discovery":route==="sources"?"Public source network":route==="oversight"?"Public oversight desk":route==="globe"?"Geographic intelligence":"Operational overview"}</h2></div><button type="button" onClick={()=>setRefresh(v=>v+1)}>Refresh intelligence</button></div>
    {route==="watchtower"&&<div className="workspace-metrics" role="group" aria-label="Workspace metrics">
      <div><strong>{sources.length}</strong><span>Bundled public sources</span></div>
      <div><strong>{saved.length}</strong><span>Saved record searches</span></div>
      <div><strong>{online?"Online":"Offline"}</strong><span>Device connectivity</span></div>
    </div>}
    <p role="status" aria-live="polite">{status==="error"?"Bundled source catalog unavailable.":healthStatus==="loading"?"Checking public source health…":healthStatus==="error"?"Live source status unavailable; local sources remain accessible.":!online?"Offline mode. Local sources and saved searches remain accessible.":"Local workspace ready."}</p>
    {(route==="oversight"||route==="globe")&&<section className="workspace-feature" aria-label={route==="oversight"?"Oversight resources":"Geographic intelligence resources"}>
      <h3>{route==="oversight"?"Accountability and oversight":"Geographic intelligence"}</h3>
      <p>{route==="oversight"?"Explore accountable public-source reporting with verifiable attribution.":"Geographic context is available through the public web workspace. Offline access remains limited to the bundled source index and saved public records."}</p>
      <div className="workspace-feature-grid">
        <article className="source-card"><h4>Public evidence network</h4><p>{sources.length} locally bundled sources. Open original documents directly.</p><a href="#sources">Browse verified source catalog</a></article>
        <article className="source-card"><h4>Public record discovery</h4><p>Search the public index and recover recently saved results offline.</p><a href="#records">Open record search</a></article>
        <article className="source-card"><h4>{route==="oversight"?"Oversight workspace":"Interactive geographic workspace"}</h4><p>Full interactive functionality requires the web service. No offline map or location tracking is implied.</p><a href={API+(route==="oversight"?"/oversight":"/globe")} target="_blank" rel="noopener noreferrer">Open web workspace</a></article>
      </div>
    </section>}
    <div className="workspace-columns">
      {(route==="watchtower"||route==="sources")&&<section aria-labelledby="desk-sources"><h3 id="desk-sources">Public source network</h3>
        <label htmlFor="desk-filter">Filter sources</label><input id="desk-filter" type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Agency or category" />
        <p>{filtered.length} sources shown</p>
        <div className="workspace-scroll">{filtered.map(s=><article key={s.id} className="source-card"><h4>{s.name}</h4><p>{s.category} · {s.attribution}</p><p>{health[s.name]==="reachable"?"Responded at last check":health[s.name]==="unavailable"?"Unavailable at last check":"Status not verified"}</p><a href={s.endpoint} target="_blank" rel="noopener noreferrer">Original source</a></article>)}</div>
      </section>}
      {(route==="watchtower"||route==="records")&&<section aria-labelledby="desk-records"><h3 id="desk-records">Public record discovery</h3>
        <form onSubmit={search} role="search" aria-label="Native public record search">
          <label htmlFor="desk-record-query">Search public records</label>
          <div className="record-controls"><input id="desk-record-query" type="search" maxLength={160} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Agency, document or identifier" required/><button type="submit" disabled={recordState==="loading"}>Search</button></div>
        </form>
        <p role="status" aria-live="polite">{recordMessage}</p>
        {records.length>0&&<div className="workspace-scroll" aria-label="Record search results">{records.map((r,i)=><article className="source-card" key={r.sourceUrl+i}><h4><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{r.title}</a></h4><p>{r.agency||"Public record"}{r.kind?" · "+r.kind:""}</p></article>)}</div>}
        <h4>Saved public intelligence</h4><p>Local results may be up to 24 hours old. Verify original sources before acting.</p>
        {saved.length===0?<p>No recent saved searches. Use Public records to search and save results.</p>:<div className="workspace-scroll">{saved.map(s=><article className="source-card" key={s.query}><h4>{s.query}</h4><p>{s.records.length} public records · Saved {new Date(s.savedAt).toLocaleString()}</p>{s.records.slice(0,3).map((r,i)=><p key={i}>{allowed(r.sourceUrl)?<a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{r.title}</a>:r.title}</p>)}</article>)}</div>}
      </section>}
    </div>
  </section>;
}
const mount=document.getElementById("react-workspace");
if(mount)createRoot(mount).render(<Workspace/>);
