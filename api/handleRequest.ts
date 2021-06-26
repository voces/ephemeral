import { handleGet } from "./handleGet.ts";
import { handlePost } from "./handlePost.ts";
import { Params } from "./parseRequestParams.ts";

export const handleRequest = (params: Params, request: Request): Response => {
  if (request.method === "POST")
    return handlePost(params, new URL(request.url).origin);
  if (request.method === "GET") return handleGet(params);
  return new Response("not found", { status: 404 });
};
