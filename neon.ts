import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  functions: {
    api: { name: "api", source: "./hello.ts" },
  },
});
