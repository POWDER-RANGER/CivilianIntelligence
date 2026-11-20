import test from "node:test";
import assert from "node:assert/strict";
import {safeRecord, saveCache, findCached, readCache, clearCache, MAX_AGE_MS} from "./shell/offline-records.mjs";
function memory() { const map = new Map(); return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}; }
const sample = {title:"Public document",sourceUrl:"https://example.gov/report",agency:"Agency"};
test("bounded cache, normalization, and 24-hour expiry", () => {
 const store=memory();
 for(let i=0;i<12;i++) assert.equal(saveCache(store,"  Query " + i,[sample],1000+i),true);
 assert.equal(readCache(store,1012).length,8);
 assert.equal(findCached(store,"QUERY 11",1012).records[0].title,"Public document");
 assert.equal(findCached(store,"query 11",1011+MAX_AGE_MS+1),null);
 assert.equal(clearCache(store),true);
 assert.equal(readCache(store).length,0);
});
test("untrusted URLs and invalid records excluded", () => {
 for(const url of ["javascript:alert(1)","http://example.org", "https://user:pass@example.org/"])
  assert.equal(safeRecord({...sample,sourceUrl:url}),null);
 const store=memory();
 saveCache(store,"test",[{...sample,sourceUrl:"javascript:alert(1)"},sample],100);
 assert.equal(findCached(store,"test",100).records.length,1);
});
test("corrupt, oversized and unavailable storage fails closed", () => {
 const store=memory();store.setItem("civint.native.public-records.v1","not-json");
 assert.deepEqual(readCache(store),[]);
 const denied={getItem:()=>{throw Error("denied")},setItem:()=>{throw Error("denied")},removeItem:()=>{throw Error("denied")}};
 assert.deepEqual(readCache(denied),[]);
 assert.equal(saveCache(denied,"x",[sample]),false);
 assert.equal(clearCache(denied),false);
});
