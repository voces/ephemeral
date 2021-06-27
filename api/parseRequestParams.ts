export type Params = {
  slug: string;
  body: string;
  noResponse: boolean;
  contentType: string;
  redirectToGet: boolean;
  authorization: string | undefined;
  expiresAt: Date | undefined;
};

const extractExpiresAt = (request: Request, searchParams: URLSearchParams) => {
  const header = request.headers.get("Expires");
  if (header)
    try {
      return new Date(header);
    } catch {
      /* do nothing */
    }

  const param = searchParams.get("expires");
  if (param)
    try {
      return new Date(param);
    } catch {
      /* do nothing */
    }
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

  const expiresAt = extractExpiresAt(request, searchParams);

  return {
    slug,
    noResponse,
    body,
    contentType,
    redirectToGet,
    authorization,
    expiresAt,
  };
};
