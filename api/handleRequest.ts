import { handleGet } from "./handleGet.ts";
import { handleHead } from "./handleHead.ts";
import { handleOptions } from "./handleOptions.ts";
import { handlePost } from "./handlePost.ts";
import { Params } from "./parseRequestParams.ts";

export const handleRequest = (params: Params, request: Request): Response => {
  if (request.method === "POST")
    return handlePost(params, new URL(request.url).origin);
  if (request.method === "GET") return handleGet(params);
  if (request.method === "OPTIONS") return handleOptions(params);
  if (request.method === "HEAD") return handleHead(params);
  console.log(request.method);
  return new Response("not found", { status: 404 });
};
