import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { Router } from "wouter";
import superjson from "superjson";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/lib/trpc";
import App from "./App";
import { getHeadMeta, type HeadMeta } from "./ssr/seo";

export type SsrRenderResult = { html: string; dehydratedState: unknown; head: HeadMeta };

export async function render(url: string): Promise<SsrRenderResult> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
  const splitAt = url.indexOf("?");
  const ssrPath = splitAt === -1 ? url : url.slice(0, splitAt);
  const ssrSearch = splitAt === -1 ? "" : url.slice(splitAt + 1);
  const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: "http://localhost/api/trpc", transformer: superjson })] });
  const html = renderToString(<trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><Router ssrPath={ssrPath} ssrSearch={ssrSearch}><App /></Router></QueryClientProvider></trpc.Provider>);
  return { html, dehydratedState: dehydrate(queryClient), head: getHeadMeta(url) };
}
