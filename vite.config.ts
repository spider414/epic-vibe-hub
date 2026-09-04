// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Build flavours:
//   bun run build        → default deploy bundle for Lovable hosting (unchanged)
//   bun run build:node   → Node.js server bundle in .output/ for self-hosting
//                          (e.g. Spaceship Node hosting). Run it on your own
//                          machine or CI after cloning the GitHub repo.
const nodeBuild = process.env["BUILD_TARGET"] === "node";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Only applied when BUILD_TARGET=node; otherwise the default preset is used.
  ...(nodeBuild ? { nitro: { preset: "node-server" } } : {}),
});
