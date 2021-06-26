import { handleGet } from "./handleGet.ts";
import { handlePost } from "./handlePost.ts";
import { Params } from "./parseRequestParams.ts";

export const handleRequest = async (
  params: Params,
  request: Request
): Promise<Response> => {
  if (request.method === "POST")
    return await handlePost(params, new URL(request.url).origin);
  if (request.method === "GET") return await handleGet(params);
  return new Response("not found", { status: 404 });
};
