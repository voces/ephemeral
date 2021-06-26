type Resource = {
  content: string;
  contentType: string;
  authorization: string | undefined;
};

const store: Record<string, Resource | undefined> = {};

const channel = new BroadcastChannel("store");

channel.onmessage = (event: MessageEvent) => {
  const { action, slug, content, contentType, authorization } = JSON.parse(
    event.data
  ) as Resource & { action: "add"; slug: string };
  if (action === "add") store[slug] = { content, contentType, authorization };
};

export const set = (
  slug: string,
  content: string,
  contentType: string,
  authorization?: string
) => {
  store[slug] = { content, contentType, authorization };
  channel.postMessage({
    action: "add",
    slug,
    content,
    contentType,
    authorization,
  });
};

export const get = (slug: string): Resource | undefined => store[slug];
