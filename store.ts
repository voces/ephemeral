const store: Record<string, string | undefined> = {};

const channel = new BroadcastChannel("store");

channel.onmessage = (event: MessageEvent) => {
  const { action, key, content } = JSON.parse(event.data);
  if (action === "add") store[key] = content;
};

export const set = (key: string, content: string) => {
  store[key] = content;
  channel.postMessage({ action: "add", key, content });
};

export const get = (key: string): string | undefined => store[key];
