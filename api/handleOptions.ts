import { has } from "../store.ts";
import { Params } from "./parseRequestParams.ts";

export const handleOptions = ({ slug }: Params) =>
  has(slug)
    ? new Response(undefined, {
        status: 204,
        headers: { Allow: "POST, GET, OPTIONS" },
      })
    : new Response("not found", { status: 404 });
