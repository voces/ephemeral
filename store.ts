type Article = { content: string; contentType: string };

const store: Record<string, Article | undefined> = {};

const channel = new BroadcastChannel("store");

channel.onmessage = (event: MessageEvent) => {
  const { action, key, content, contentType } = JSON.parse(event.data);
  if (action === "add") store[key] = { content, contentType };
};

export const set = (key: string, content: string, contentType: string) => {
  store[key] = { content, contentType };
  channel.postMessage({ action: "add", key, content, contentType });
};

export const get = (key: string): Article | undefined => store[key];
