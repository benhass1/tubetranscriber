import { hydrateRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { Router } from "wouter";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { clearTurnstileToken, getTurnstileToken } from "@/components/TurnstileWidget";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
const trpcClient = trpc.createClient({ links: [httpBatchLink({
  url: "/api/trpc",
  transformer: superjson,
  fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    const token = getTurnstileToken();
    if (token) {
      headers.set("x-turnstile-token", token);
      clearTurnstileToken();
    }
    return globalThis.fetch(input, { ...(init ?? {}), headers, credentials: "include" });
  },
})] });
const rawState = (window as typeof window & { __RQ_STATE__?: unknown }).__RQ_STATE__;
const dehydratedState = rawState ? superjson.deserialize(rawState as any) as DehydratedState : undefined;
const mount = document.getElementById("root")!;

hydrateRoot(mount, <trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><HydrationBoundary state={dehydratedState}><Router><App /></Router></HydrationBoundary></QueryClientProvider></trpc.Provider>);
