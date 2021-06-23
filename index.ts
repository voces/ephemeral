/// <reference path="./deploy.d.ts" />

import { get, set } from "./store.ts";

addEventListener("fetch", async (event: FetchEvent) => {
  const { pathname } = new URL(event.request.url);

  const key = pathname.slice(1);
  const existingContent = get(key);

  if (event.request.method === "GET") {
    if (!existingContent) {
      return event.respondWith(new Response("not found", { status: 404 }));
    } else {
      return event.respondWith(
        new Response(existingContent.content, {
          headers: { "Content-Type": existingContent.contentType },
        })
      );
    }
  } else if (event.request.method === "POST") {
    if (existingContent) {
      return event.respondWith(new Response("already exists", { status: 400 }));
    }

    const content = await event.request.text();
    // Limit to 32KiB
    if (content.length > 32 * 1024)
      return event.respondWith(new Response("too large", { status: 400 }));

    const contentType =
      event.request.headers.get("Content-Type") ?? "text/plain";

    set(key, content, contentType);
    return event.respondWith(
      new Response(content, { headers: { "Content-Type": contentType } })
    );
  }

  return event.respondWith(new Response("not found", { status: 404 }));
});
