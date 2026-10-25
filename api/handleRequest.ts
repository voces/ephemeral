import { handleGet } from "./handleGet.ts";
import { handleHead } from "./handleHead.ts";
import { handleOptions } from "./handleOptions.ts";
import { handlePost } from "./handlePost.ts";
import { Params } from "./parseRequestParams.ts";

// Behind nginx the request arrives over plain http, so take the scheme the
// client used from X-Forwarded-Proto; otherwise Location would point at http.
// Safe to trust: the server listens on localhost only.
const origin = (request: Request) => {
  const url = new URL(request.url);
  const proto = request.headers.get("X-Forwarded-Proto");
  if (proto === "http" || proto === "https") url.protocol = proto;
  return url.origin;
};

export const handleRequest = async (
  params: Params,
  request: Request,
): Promise<Response> => {
  if (request.method === "POST") return handlePost(params, origin(request));
  if (request.method === "GET") return await handleGet(params);
  if (request.method === "OPTIONS") return handleOptions(params);
  if (request.method === "HEAD") return await handleHead(params);

  console.log("unhandled method", request.method);
  return new Response("not found", { status: 404 });
};
