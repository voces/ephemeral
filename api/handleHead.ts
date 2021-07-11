import { get } from "../store.ts";
import { authorizationMatches } from "../util/auth.ts";
import { Params } from "./parseRequestParams.ts";

export const handleHead = ({
  slug,
  authorization: passedAuthorization,
}: Params) => {
  const existingContent = get(slug);
  if (!existingContent) return new Response("not found", { status: 404 });

  const { contentType, authorization: existingAuthorization } = existingContent;

  // 401 if auth mismatch; note we will always 401 (not 403) and prompt for
  // basic auth
  if (
    existingAuthorization &&
    (!passedAuthorization ||
      !authorizationMatches(passedAuthorization, existingAuthorization))
  )
    return new Response(undefined, {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });

  return new Response(undefined, {
    headers: { "Content-Type": contentType },
  });
};
