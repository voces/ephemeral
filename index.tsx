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

const handler = async (request: Request) => {
  const params = await parseRequest(request);

  if (params.slug in statics) return new Response(...statics[params.slug]);

  if (params.slug.length) {
    // If we have a slug, we're using the API
    return handleRequest(params, request);
  }

  return new Response(
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
  );
};

addEventListener("fetch", async (event) => {
  const start = Date.now();
  if (!isFetchEvent(event)) return;
  const response = await handler(event.request);
  console.log(response.status, event.request.url, Date.now() - start + "ms");
  event.respondWith(response);
});
