import { parseRequest } from "./api/parseRequestParams.ts";
import { handleRequest } from "./api/handleRequest.ts";
import { h, renderToString } from "./deps.ts";
import { App } from "./webapp/App.tsx";
import { statics } from "./webapp/statics.ts";

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

  if (params.slug in statics)
    return event.respondWith(new Response(...statics[params.slug]));

  if (params.slug.length)
    // If we have a slug, we're using the API
    return event.respondWith(handleRequest(params, event.request));

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
