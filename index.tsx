import { parseRequest } from "./api/parseRequestParams.ts";
import { handleRequest } from "./api/handleRequest.ts";
import { h, renderToString } from "./deps.ts";
import { App } from "./webapp/App.tsx";
import { statics } from "./webapp/statics.ts";

const css = await Deno.readTextFile(
  new URL("./webapp/style.css", import.meta.url),
);

const handler = async (request: Request) => {
  const params = await parseRequest(request);

  if (params.slug in statics) return new Response(...statics[params.slug]);

  if (params.slug.length) {
    // If we have a slug, we're using the API
    return handleRequest(params, request);
  }

  return new Response(
    `<!DOCTYPE html>
${
      renderToString(
        <html>
          <head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <style>{css}</style>
          </head>
          <body>
            <App />
          </body>
        </html>,
      )
    }`,
    { headers: { "Content-Type": "text/html" } },
  );
};

Deno.serve(async (request) => {
  const start = Date.now();
  const response = await handler(request);
  console.log(
    request.method,
    request.url,
    response.status,
    Date.now() - start + "ms",
  );
  return response;
});
