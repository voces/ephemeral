/// <reference path="./deploy.d.ts" />

import { get, set } from "./store.ts";

addEventListener("fetch", async (event: FetchEvent) => {
  const { pathname, searchParams } = new URL(event.request.url);

  const key = pathname.slice(1);
  const existingContent = get(key);

  if (event.request.method === "GET") {
    if (typeof existingContent !== "string") {
      return event.respondWith(new Response("not found", { status: 404 }));
    } else {
      return event.respondWith(new Response(existingContent));
    }
  } else if (event.request.method === "POST") {
    if (existingContent) {
      return event.respondWith(new Response("already exists", { status: 400 }));
    }
    const content = await event.request.text();
    // Limit to 32KiB
    if (content.length > 32 * 1024)
      return event.respondWith(new Response("too large", { status: 400 }));

    set(key, content);
    return event.respondWith(new Response(content));
  }

  return event.respondWith(new Response("not found", { status: 404 }));
});
