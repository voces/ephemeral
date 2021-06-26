import { bcrypt } from "../deps.ts";
import { get } from "../store.ts";
import { Params } from "./parseRequestParams.ts";

const authorizationMatches = (
  passedAuthorization: string,
  existingAuthorization: string
) => {
  if (bcrypt.compareSync(passedAuthorization, existingAuthorization))
    return true;

  if (passedAuthorization.startsWith("Basic ")) {
    const withoutUsername =
      "Basic " +
      btoa(atob(passedAuthorization.split(" ")[1]).replace(/[^:]*:/, ":"));

    if (
      withoutUsername !== passedAuthorization &&
      bcrypt.compareSync(withoutUsername, existingAuthorization)
    )
      return true;
  }

  return false;
};

export const handleGet = ({
  slug,
  authorization: passedAuthorization,
}: Params) => {
  const existingContent = get(slug);
  if (!existingContent) return new Response("not found", { status: 404 });

  const {
    content,
    contentType,
    authorization: existingAuthorization,
  } = existingContent;

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

  return new Response(content, {
    headers: { "Content-Type": contentType },
  });
};
