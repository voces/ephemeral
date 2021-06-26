export type Params = {
  slug: string;
  body: string;
  noResponse: boolean;
  contentType: string;
  redirectToGet: boolean;
  authorization?: string;
};

export const parseRequest = async (request: Request): Promise<Params> => {
  const { pathname, searchParams } = new URL(request.url);

  let formBody: Record<string, string | undefined> | undefined;
  if (pathname === "/") {
    const text = await request.text();
    formBody = Object.fromEntries(
      text
        .split("&")
        .map((v) =>
          v.split("=").map((v) => decodeURIComponent(v.replace(/\+/g, " ")))
        )
    );
  }

  const slug = formBody?.["path"] ?? pathname.slice(1);

  const body = formBody?.["body"] ?? (await request.text());

  const noResponse =
    typeof searchParams.get("no-response") === "string" ??
    (formBody && "no-response" in formBody);

  // Don't fallback to Content-Type if formBody specified, as it is going to be
  // x-www-form-urlencoded
  const contentType =
    (formBody
      ? formBody["contenttype"]
      : request.headers.get("Content-Type")) ?? "text/plain";

  const redirectToGet = !!formBody;

  const authorization = formBody
    ? formBody.password
      ? `Basic ${btoa(`:${formBody.password}`)}`
      : undefined
    : request.headers.get("Authorization") ?? undefined;

  return { slug, noResponse, body, contentType, redirectToGet, authorization };
};
