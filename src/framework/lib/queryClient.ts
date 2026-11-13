import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

// A module-level `QueryClient` singleton is unsafe under SSR: Next.js
// reuses the same server worker (and therefore the same module scope) for
// many unrelated requests, so one user's cached query results could leak
// into another request's server-rendered HTML — and since the fresh
// client-side client always starts unloaded, that stale server cache also
// produces a hydration mismatch on the very first paint. On the server we
// hand out a brand-new client per call (i.e. per request); in the browser
// we memoize a single instance so the app keeps its cache across renders.
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
