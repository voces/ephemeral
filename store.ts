import { BinaryHeap } from "./util/BinaryHeap.ts";

const id = globalThis.crypto.randomUUID();

const DEFAULT_EXPIRATION = 1000 * 60 * 60; // 1 hour

type Resource = {
  content: string;
  contentType: string;
  authorization: string | undefined;
  createdAt: number;
  expiresAt: number;
};
const store: Record<string, Resource | undefined> = {};
const loadingStore = new Set<string>();

type Node = { slug: string; expiresAt: number };
const expiries = new BinaryHeap<Node>((node) => node.expiresAt);

type TypedMessage =
  | { type: "set"; slug: string; resource: Resource }
  | { type: "keys" }
  | { type: "onKeys"; id: string; keys: string[] }
  | { type: "resolve"; keys: string[]; origin: string }
  | { type: "onResolve"; store: Record<string, Resource> };

class TypedBroadcastChannel {
  private channel: BroadcastChannel;

  constructor(onmessage: (event: MessageEvent<TypedMessage>) => void) {
    this.channel = new BroadcastChannel("store");
    this.channel.onmessage = onmessage;
  }

  postMessage(message: TypedMessage) {
    this.channel.postMessage(message);
  }
}

function assertUnreachable(_x: never): never {
  throw new Error("Didn't expect to get here");
}

let actuallyFetchingKeys = false;

let resolvingKeysDone: () => void;
const resolvingKeys = new Promise<void>((resolve) =>
  resolvingKeysDone = resolve
);

const channel = new TypedBroadcastChannel(({ data }) => {
  if (data.type === "set") {
    const { slug, resource } = data;
    expiries.push({ slug, expiresAt: resource.expiresAt });
    store[slug] = resource;
  } else if (data.type === "keys") {
    const keys = Object.keys(store);
    if (keys.length === 0) return;
    console.log("sending keys:", keys);
    channel.postMessage({ type: "onKeys", id, keys: keys });
  } else if (data.type === "onKeys") {
    actuallyFetchingKeys = true;
    const { keys, id } = data;
    console.log("from", id, "received keys:", keys);
    const keysToResolve: string[] = [];
    for (const key of keys) {
      if (loadingStore.has(key)) continue;
      loadingStore.add(key);
      keysToResolve.push(key);
    }
    if (keysToResolve.length > 0) {
      console.log("resolve keys:", keysToResolve);
      channel.postMessage({ type: "resolve", keys: keysToResolve, origin: id });
    }
  } else if (data.type === "resolve") {
    const { origin, keys } = data;
    if (origin !== id) return;
    const resolutions = Object.fromEntries(
      keys.map((key) => [key, store[key]]).filter(([, v]) => v),
    );
    if (Object.keys(resolutions > 0)) {
      console.log("resolving keys:", resolutions);
      channel.postMessage({ type: "onResolve", store: resolutions });
    }
  } else if (data.type === "onResolve") {
    console.log(
      "resolved keys:",
      Object.keys(data.store),
    );
    Object.assign(store, data.store);
    for (const slug in data.store) {
      expiries.push({ slug, expiresAt: data.store[slug].expiresAt });
    }
    resolvingKeysDone();
  } else {
    assertUnreachable(data);
  }
});

channel.postMessage({ type: "keys" });
console.log("load store");

const ready = Promise.race([
  resolvingKeys,
  new Promise<void>((resolve) =>
    setTimeout(() => {
      console.log("timed out on initial resolution", { actuallyFetchingKeys });
      if (actuallyFetchingKeys) {
        setTimeout(() => {
          console.log("final timeout on resolution");
          resolve();
        }, 5_000);
      } else resolve();
    }, 5_000)
  ),
]);

export const set = (
  slug: string,
  resource: Omit<Resource, "expiresAt" | "createdAt"> & {
    expiresAt: Date | undefined;
  },
) => {
  const expiresAt = resource.expiresAt?.getTime() ??
    Date.now() + DEFAULT_EXPIRATION;
  const createdAt = Date.now();

  store[slug] = { ...resource, expiresAt, createdAt };
  expiries.push({ slug, expiresAt });

  channel.postMessage({ type: "set", slug, resource: store[slug]! });
};

export const get = async (slug: string): Promise<Resource | undefined> => {
  await ready;
  return store[slug];
};

export const has = (slug: string): boolean => slug in store;

setInterval(() => {
  try {
    const now = Date.now();
    while (expiries.length > 0 && expiries[0].expiresAt <= now) {
      const { slug } = expiries.pop();
      delete store[slug];
    }
  } catch {
    /* do nothing*/
  }
}, 1000);
