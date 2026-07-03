// Resources live for one hour from creation by default; a caller-supplied
// `Expires` sets an absolute deadline instead.
const DEFAULT_EXPIRATION = 1000 * 60 * 60; // 1 hour

type Resource = {
  content: string;
  contentType: string;
  authorization: string | undefined;
  createdAt: number;
  expiresAt: number;
};

const kv = await Deno.openKv();

const key = (slug: string) => ["resource", slug];

export const set = async (
  slug: string,
  resource: Omit<Resource, "expiresAt" | "createdAt"> & {
    expiresAt: Date | undefined;
  },
): Promise<void> => {
  const now = Date.now();
  const expiresAt = resource.expiresAt?.getTime() ?? now + DEFAULT_EXPIRATION;

  const stored: Resource = {
    content: resource.content,
    contentType: resource.contentType,
    authorization: resource.authorization,
    createdAt: now,
    expiresAt,
  };

  // Persist to Deno KV so resources survive isolate recycling (the new Deno
  // Deploy scales isolates to zero within seconds, unlike Deploy Classic).
  // `expireIn` (ms from now) lets the platform reclaim the key server-side.
  await kv.set(key(slug), stored, { expireIn: Math.max(1, expiresAt - now) });
};

export const get = async (slug: string): Promise<Resource | undefined> => {
  const { value } = await kv.get<Resource>(key(slug));
  if (!value) return undefined;

  // KV's TTL cleanup can be lazy (especially on the local SQLite backend), so
  // never serve a resource past its expiry — delete it and report it gone.
  if (value.expiresAt <= Date.now()) {
    await kv.delete(key(slug));
    return undefined;
  }

  return value;
};

export const has = async (slug: string): Promise<boolean> => {
  const { value } = await kv.get<Resource>(key(slug));
  return value !== null && value.expiresAt > Date.now();
};
