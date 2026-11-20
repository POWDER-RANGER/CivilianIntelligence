import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {readCache} from "./shell/offline-records.mjs";

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
  const online=useConnectivity();
  const [sources,setSources]=useState<Source[]>([]);
  const [status,setStatus]=useState<Status>("loading");
  const [health,setHealth]=useState<Record<string,string>>({});
  const [healthStatus,setHealthStatus]=useState<Status>("offline");
  const [filter,setFilter]=useState("");
  const [refresh,setRefresh]=useState(0);
  const [saved,setSaved]=useState<ReturnType<typeof readCache>>([]);
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
    fetch(API+"/api/civint/sources",{credentials:"omit",cache:"no-store",signal:abort.signal,headers:{Accept:"application/json"}})
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
    <div className="workspace-heading"><div><p className="eyebrow">LOCAL INTELLIGENCE DESK</p><h2>Operational overview</h2></div><button type="button" onClick={()=>setRefresh(v=>v+1)}>Refresh intelligence</button></div>
    <div className="workspace-metrics" role="group" aria-label="Workspace metrics">
      <div><strong>{sources.length}</strong><span>Bundled public sources</span></div>
      <div><strong>{saved.length}</strong><span>Saved record searches</span></div>
      <div><strong>{online?"Online":"Offline"}</strong><span>Device connectivity</span></div>
    </div>
    <p role="status" aria-live="polite">{status==="error"?"Bundled source catalog unavailable.":healthStatus==="loading"?"Checking public source health…":healthStatus==="error"?"Live source status unavailable; local sources remain accessible.":!online?"Offline mode. Local sources and saved searches remain accessible.":"Local workspace ready."}</p>
    <div className="workspace-columns">
      <section aria-labelledby="desk-sources"><h3 id="desk-sources">Public source network</h3>
        <label htmlFor="desk-filter">Filter sources</label><input id="desk-filter" type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Agency or category" />
        <p>{filtered.length} sources shown</p>
        <div className="workspace-scroll">{filtered.map(s=><article key={s.id} className="source-card"><h4>{s.name}</h4><p>{s.category} · {s.attribution}</p><p>{health[s.name]==="reachable"?"Responded at last check":health[s.name]==="unavailable"?"Unavailable at last check":"Status not verified"}</p><a href={s.endpoint} target="_blank" rel="noopener noreferrer">Original source</a></article>)}</div>
      </section>
      <section aria-labelledby="desk-records"><h3 id="desk-records">Saved public intelligence</h3><p>Local results may be up to 24 hours old. Verify original sources before acting.</p>
        {saved.length===0?<p>No recent saved searches. Use Public records to search and save results.</p>:<div className="workspace-scroll">{saved.map(s=><article className="source-card" key={s.query}><h4>{s.query}</h4><p>{s.records.length} public records · Saved {new Date(s.savedAt).toLocaleString()}</p>{s.records.slice(0,3).map((r,i)=><p key={i}>{allowed(r.sourceUrl)?<a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{r.title}</a>:r.title}</p>)}</article>)}</div>}
      </section>
    </div>
  </section>;
}
const mount=document.getElementById("react-workspace");
if(mount)createRoot(mount).render(<Workspace/>);
