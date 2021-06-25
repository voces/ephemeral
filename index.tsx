import { h, renderToString } from "./deps.ts";
import { get, set } from "./store.ts";
import { App } from "./webapp/App.tsx";

type FetchEvent = {
  request: Request;
  respondWith: (response: Response) => void;
};

const isFetchEvent = (event: Event | FetchEvent): event is FetchEvent => true;

addEventListener("fetch", async (event) => {
  if (!isFetchEvent(event)) return;
  const { pathname, origin } = new URL(event.request.url);

  let formBody: Record<string, string | undefined> | undefined;
  if (pathname === "/") {
    const text = await event.request.text();
    formBody = Object.fromEntries(
      text
        .split("&")
        .map((v) =>
          v.split("=").map((v) => decodeURIComponent(v.replace(/\+/g, " ")))
        )
    );
  }

  const key = formBody ? formBody["path"] ?? "" : pathname.slice(1);
  const existingContent = get(key);

  if (event.request.method === "GET" && key.length) {
    if (!existingContent) {
      return event.respondWith(new Response("not found", { status: 404 }));
    } else {
      return event.respondWith(
        new Response(existingContent.content, {
          headers: { "Content-Type": existingContent.contentType },
        })
      );
    }
  } else if (event.request.method === "POST" && key.length) {
    if (existingContent) {
      return event.respondWith(new Response("already exists", { status: 400 }));
    }

    const content = formBody
      ? formBody["body"] ?? ""
      : await event.request.text();

    // Limit to 32KiB
    if (content.length > 32 * 1024)
      return event.respondWith(new Response("too large", { status: 400 }));

    const contentType =
      (formBody
        ? formBody["contenttype"]
        : event.request.headers.get("Content-Type")) ?? "text/plain";

    set(key, content, contentType);

    return event.respondWith(
      formBody
        ? new Response(undefined, {
            status: 303,
            headers: { Location: `${origin}/${key}` },
          })
        : new Response(content, {
            headers: {
              "Content-Type": contentType,
              Location: `${origin}/${key}`,
            },
          })
    );
  }

  return event.respondWith(
    new Response(
      `<!DOCTYPE html>
  <html>
    <style>
      html {
        height: 100%;
      }
      
      body {
        margin: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      input,
      button,
      textarea {
        padding: 0.25em;
        font-size: inherit;
        font-family: inherit;
        border-width: 1px;
        border-radius: 2px;
        border-style: inset;
        border-color: #808080;
      }
      
      button {
        background-color: white;
        padding: 0.25em 1em;
      }
      
      input:hover,
      button:hover,
      textarea:hover {
        text-shadow: 0 0 1px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        box-shadow: 0 0 0.125em rgba(0, 0, 0, 0.4);
      }
    </style>
  </html>
  <body>
  ${renderToString(<App />)}
  </body>`,
      {
        headers: { "Content-Type": "text/html" },
      }
    )
  );
});
