import { BinaryHeap } from "./util/BinaryHeap.ts";

const DEFAULT_EXPIRATION = 1000 * 60 * 60; // 1 hour

type Resource = {
  content: string;
  contentType: string;
  authorization: string | undefined;
  createdAt: number;
  expiresAt: number;
};
const store: Record<string, Resource | undefined> = {};

type Node = { slug: string; expiresAt: number };
const expiries = new BinaryHeap<Node>((node) => node.expiresAt);

const channel = new BroadcastChannel("store");

channel.onmessage = (event: MessageEvent) => {
  // let data;
  // try {
  //   data = JSON.parse(event.data);
  // } catch (err) {
  //   console.log(event.data);
  //   throw err;
  // }
  const { slug, resource } = event.data as {
    slug: string;
    resource: Resource;
  };
  expiries.push({ slug, expiresAt: resource.expiresAt });
  store[slug] = resource;
};

export const set = (
  slug: string,
  resource: Omit<Resource, "expiresAt" | "createdAt"> & {
    expiresAt: Date | undefined;
  }
) => {
  const expiresAt =
    resource.expiresAt?.getTime() ?? Date.now() + DEFAULT_EXPIRATION;
  const createdAt = Date.now();

  store[slug] = { ...resource, expiresAt, createdAt };
  expiries.push({ slug, expiresAt });

  channel.postMessage({ slug, resource: store[slug] });
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
