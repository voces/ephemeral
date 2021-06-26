import { get, set } from "../store.ts";
import { Params } from "./parseRequestParams.ts";

export const handlePost = ({
  slug,
  body,
  contentType,
  noResponse,
  redirectToGet,
  origin,
}: Params) => {
  const existingContent = get(slug);
  if (existingContent) return new Response("already exists", { status: 400 });

  // Limit to 32KiB
  if (body.length > 32 * 1024)
    return new Response("too large", { status: 400 });

  set(slug, body, contentType);

  if (noResponse) return new Response(undefined, { status: 201 });

  // If we post via form body, the slug won't actually match
  if (redirectToGet)
    return new Response(undefined, {
      status: 303,
      headers: { Location: `${origin}/${slug}` },
    });

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      Location: `${origin}/${slug}`,
    },
  });
};
