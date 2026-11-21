import test from "node:test";
import assert from "node:assert/strict";
import {validatePublicApiUrl,createPublicApiTransport} from "./public-api-transport.mjs";
const root="https://civintelligence.onrender.com";
test("allowlists exact public API paths and rejects foreign or credential-bearing destinations",()=>{
  assert.equal(validatePublicApiUrl(root+"/api/civint/sources"),root+"/api/civint/sources");
  for(const url of ["https://evil.test/api/civint/sources",root+"/api/civint/sources/../private",root+"/api/civint/sources?token=x",root+"/api/civint/records/search?redirect=https://evil.test","https://user:pass@civintelligence.onrender.com/api/civint/sources"])assert.throws(()=>validatePublicApiUrl(url));
});
test("native transport sends only credential-free GET and handles structured data",async()=>{
  let seen;
  const fetcher=createPublicApiTransport({nativeHttp:{get:async o=>{seen=o;return {status:200,data:{sources:[]}};}}});
  const r=await fetcher(root+"/api/civint/sources",{credentials:"omit"});
  assert.deepEqual(await r.json(),{sources:[]});
  assert.equal(seen.url,root+"/api/civint/sources");
  assert.equal(seen.headers.Accept,"application/json");
  await assert.rejects(fetcher(root+"/api/civint/sources",{method:"POST"}));
  await assert.rejects(fetcher(root+"/api/civint/sources",{credentials:"include"}));
});
test("native transport rejects pre-cancelled and post-cancelled responses",async()=>{
  const c=new AbortController();c.abort();
  const f=createPublicApiTransport({nativeHttp:{get:async()=>({status:200,data:{}})}});
  await assert.rejects(f(root+"/api/civint/sources",{signal:c.signal}),{name:"AbortError"});
  const d=new AbortController();
  const g=createPublicApiTransport({nativeHttp:{get:async()=>{d.abort();return {status:200,data:{}};}}});
  await assert.rejects(g(root+"/api/civint/sources",{signal:d.signal}),{name:"AbortError"});
});
test("browser transport remains CORS-enforced with no credentials",async()=>{
  let seen;
  const f=createPublicApiTransport({browserFetch:async(u,o)=>{seen={u,o};return {ok:true};}});
  await f(root+"/api/civint/sources",{credentials:"omit",mode:"cors"});
  assert.equal(seen.o.mode,"cors");
  assert.equal(seen.o.credentials,"omit");
});

test("native request rejects promptly on cancellation despite hung native plugin",async()=>{
  const controller=new AbortController();
  const fetcher=createPublicApiTransport({nativeHttp:{get:()=>new Promise(()=>{})}});
  const pending=fetcher(root+"/api/civint/sources",{signal:controller.signal});
  controller.abort();
  await assert.rejects(pending,{name:"AbortError"});
});
test("native late response cannot escape aborted lifecycle",async()=>{
  let finish;
  const controller=new AbortController();
  const fetcher=createPublicApiTransport({nativeHttp:{get:()=>new Promise(resolve=>{finish=resolve;})}});
  const pending=fetcher(root+"/api/civint/sources",{signal:controller.signal});
  controller.abort();
  finish({status:200,data:{sources:[]}});
  await assert.rejects(pending,{name:"AbortError"});
});
