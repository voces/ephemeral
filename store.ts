type Article = { content: string; contentType: string };

const store: Record<string, Article | undefined> = {};

const channel = new BroadcastChannel("store");

channel.onmessage = (event: MessageEvent) => {
  const { action, slug, content, contentType } = JSON.parse(event.data);
  if (action === "add") store[slug] = { content, contentType };
};

export const set = (slug: string, content: string, contentType: string) => {
  store[slug] = { content, contentType };
  channel.postMessage({ action: "add", slug, content, contentType });
};

export const get = (slug: string): Article | undefined => store[slug];
