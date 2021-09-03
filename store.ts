import { BinaryHeap } from "./util/BinaryHeap.ts";
import { generate as generateUUID } from "https://deno.land/std@0.106.0/uuid/v4.ts";

const id = generateUUID();

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

const channel = new TypedBroadcastChannel(({ data }) => {
  if (data.type === "set") {
    const { slug, resource } = data;
    expiries.push({ slug, expiresAt: resource.expiresAt });
    store[slug] = resource;
  } else if (data.type === "keys") {
    channel.postMessage({ type: "onKeys", id, keys: Object.keys(store) });
  } else if (data.type === "onKeys") {
    const { keys, id } = data;
    const keysToResolve: string[] = [];
    for (const key of keys) {
      if (loadingStore.has(key)) continue;
      loadingStore.add(key);
      keysToResolve.push(key);
    }
    channel.postMessage({ type: "resolve", keys: keysToResolve, origin: id });
  } else if (data.type === "resolve") {
    const { origin, keys } = data;
    if (origin !== id) return;
    channel.postMessage({
      type: "onResolve",
      store: Object.fromEntries(
        keys.map((key) => [key, store[key]]).filter(([, v]) => v),
      ),
    });
  } else if (data.type === "onResolve") {
    Object.assign(store, data.store);
    for (const slug in data.store) {
      expiries.push({ slug, expiresAt: data.store[slug].expiresAt });
    }
  } else {
    assertUnreachable(data);
  }
});

channel.postMessage({ type: "keys" });

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

export const get = (slug: string): Resource | undefined => store[slug];

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
