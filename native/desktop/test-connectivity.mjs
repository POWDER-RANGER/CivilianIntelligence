import test from "node:test";
import assert from "node:assert/strict";
import {reconnectDelay,createConnectivityProbe} from "./connectivity.mjs";
test("bounded exponential retry and deterministic jitter",()=>{
 assert.equal(reconnectDelay(0,()=>0),1000);
 assert.equal(reconnectDelay(4,()=>0),16000);
 assert.equal(reconnectDelay(100,()=>0),60000);
 assert.equal(reconnectDelay(-1,()=>0),1000);
});
test("probe rejects insecure origins",()=>assert.throws(()=>createConnectivityProbe({endpoint:"http://example.com"})));
test("probe never sends credentials and checks HTTP status",async()=>{
 let options;
 const probe=createConnectivityProbe({endpoint:"https://example.com/health",fetcher:async(_url,opts)=>{options=opts;return {ok:true}}});
 assert.equal(await probe(),true);
 assert.equal(options.credentials,"omit");
 assert.equal(options.cache,"no-store");
});
test("probe rejects failed HTTP status",async()=>{
 const probe=createConnectivityProbe({endpoint:"https://example.com/health",fetcher:async()=>({ok:false})});
 await assert.rejects(probe(),/unavailable/);
});
test("probe respects cancellation",async()=>{
 const controller=new AbortController();controller.abort();
 const probe=createConnectivityProbe({endpoint:"https://example.com/health",fetcher:async()=>({ok:true})});
 await assert.rejects(probe(controller.signal),/Cancelled/);
});
