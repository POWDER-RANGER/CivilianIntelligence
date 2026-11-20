import {chromium} from "playwright";
import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {resolve,extname} from "node:path";
const root=resolve("native/desktop/shell");
const mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".json":"application/json",".css":"text/css"};
const server=createServer((req,res)=>{const path=decodeURIComponent((req.url||"/").split("?")[0]);if(path.includes("..")){res.writeHead(403).end();return;}try{const file=resolve(root,"."+ (path==="/"?"/index.html":path));const data=readFileSync(file);res.writeHead(200,{"content-type":mime[extname(file)]||"application/octet-stream"});res.end(data);}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("http://127.0.0.1:"+server.address().port+"/");
 await page.getByRole("heading",{name:"Operational overview"}).waitFor({timeout:15000});
 await page.getByRole("group",{name:"Workspace metrics"}).getByText("Bundled public sources").waitFor();
 await page.getByLabel("Filter sources").fill("nonexistent source query");
 await page.getByText("0 sources shown").waitFor();
 await page.context().setOffline(true);
 await page.getByText("Offline mode. Local sources and saved searches remain accessible.").waitFor();
 if(errors.length)throw Error("Browser exceptions: "+errors.join("; "));
 console.log("PASS: React bundle mounted, public catalog rendered, filtering works, offline status shown, zero page errors");
}finally{await browser.close();server.close();}
