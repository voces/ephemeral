import { parseRequest } from "./api/parseRequestParams.ts";
import { handleRequest } from "./api/handleRequest.ts";
import { h, renderToString } from "./deps.ts";
import { App } from "./webapp/App.tsx";

const css = await fetch(
  import.meta.url.split("/").slice(0, -1).join("/") + "/webapp/style.css"
).then((r) => r.text());

type FetchEvent = {
  request: Request;
  respondWith: (response: Response) => void;
};

const isFetchEvent = (event: Event | FetchEvent): event is FetchEvent => true;

addEventListener("fetch", async (event) => {
  if (!isFetchEvent(event)) return;

  const params = await parseRequest(event.request);

  // If we have a slug, we're using the API
  if (params.slug.length) {
    return event.respondWith(await handleRequest(params, event.request));
  }

  return event.respondWith(
    new Response(
      `<!DOCTYPE html>
${renderToString(
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>{css}</style>
    </head>
    <body>
      <App />
    </body>
  </html>
)}`,
      { headers: { "Content-Type": "text/html" } }
    )
  );
});
