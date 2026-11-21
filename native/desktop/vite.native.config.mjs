import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {resolve} from "node:path";
export default defineConfig({
  plugins:[react()],
  define:{"process.env.NODE_ENV":JSON.stringify("production")},
  publicDir:false,
  build:{
    outDir:"shell",
    emptyOutDir:false,
    sourcemap:false,
    minify:true,
    lib:{entry:resolve("react-workspace.tsx"),formats:["es"],fileName:()=>"react-workspace.js"},
    rollupOptions:{output:{assetFileNames:"react-workspace-[name][extname]"}}
  }
});
