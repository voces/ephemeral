import { handleGet } from "./handleGet.ts";
import { handleHead } from "./handleHead.ts";
import { handleOptions } from "./handleOptions.ts";
import { handlePost } from "./handlePost.ts";
import { Params } from "./parseRequestParams.ts";

export const handleRequest = async (
  params: Params,
  request: Request,
): Promise<Response> => {
  if (request.method === "POST") {
    return handlePost(params, new URL(request.url).origin);
  }
  if (request.method === "GET") return await handleGet(params);
  if (request.method === "OPTIONS") return handleOptions(params);
  if (request.method === "HEAD") return await handleHead(params);

  console.log("unhandled method", request.method);
  return new Response("not found", { status: 404 });
};
