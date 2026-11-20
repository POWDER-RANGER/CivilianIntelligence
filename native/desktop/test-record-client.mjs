import test from "node:test";
import assert from "node:assert/strict";
import {parseRecordResponse,searchPublicRecords} from "./record-client.mjs";
import {findCached} from "./shell/offline-records.mjs";
function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const record={title:"Agency disclosure",sourceUrl:"https://example.gov/record",agency:"Agency"};
test("validates public record responses and strips unsafe URLs",()=>{
  assert.equal(parseRecordResponse({results:[record,{title:"unsafe",sourceUrl:"javascript:alert(1)"}]}).length,1);
  assert.throws(()=>parseRecordResponse({results:{}}));
  assert.throws(()=>parseRecordResponse({results:Array(101).fill(record)}));
});
test("live search persists validated records, then recovers on network failure",async()=>{
  const store=storage();
  const live=await searchPublicRecords("  AGENCY  ",{storage:store,fetcher:async()=>({ok:true,json:async()=>({results:[record]})})});
  assert.equal(live.source,"live");
  assert.equal(live.records.length,1);
  assert.equal(findCached(store,"agency").records.length,1);
  const offline=await searchPublicRecords("agency",{storage:store,fetcher:async()=>{throw Error("offline");}});
  assert.equal(offline.source,"cache");
  assert.equal(offline.records[0].title,record.title);
});
test("rejects unknown results and never caches malformed payload",async()=>{
  const store=storage();
  await assert.rejects(searchPublicRecords("bad",{storage:store,fetcher:async()=>({ok:true,json:async()=>({results:null})})}));
  assert.equal(findCached(store,"bad"),null);
});
test("never substitutes cached results for a user-cancelled request",async()=>{
  const store=storage();
  await searchPublicRecords("agency",{storage:store,fetcher:async()=>({ok:true,json:async()=>({results:[record]})})});
  const controller=new AbortController();
  controller.abort();
  await assert.rejects(searchPublicRecords("agency",{storage:store,signal:controller.signal,fetcher:async()=>{throw Error("offline");}}));
});
