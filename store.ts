// Resources live for a sliding 15-minute window: the clock resets on every
// access, so an item only disappears after 15 minutes of *inactivity*.
const DEFAULT_TTL = 1000 * 60 * 15; // 15 minutes

type Resource = {
  content: string;
  contentType: string;
  authorization: string | undefined;
  createdAt: number;
  expiresAt: number;
  // Sliding window in ms, refreshed on each access. `undefined` means the
  // caller pinned a fixed `Expires`, which we honor as an absolute deadline.
  ttl: number | undefined;
};

const kv = await Deno.openKv();

const key = (slug: string) => ["resource", slug];

const persist = (slug: string, resource: Resource) => {
  // `expireIn` (ms from now) lets Deno KV reclaim the key server-side. We also
  // check `expiresAt` on read since KV's TTL cleanup can be lazy.
  const expireIn = Math.max(1, resource.expiresAt - Date.now());
  return kv.set(key(slug), resource, { expireIn });
};

export const set = async (
  slug: string,
  resource: Omit<Resource, "expiresAt" | "createdAt" | "ttl"> & {
    expiresAt: Date | undefined;
  },
): Promise<void> => {
  const now = Date.now();

  // A caller-supplied `Expires` is a fixed deadline; otherwise the item uses a
  // sliding window that refreshes on each access.
  const ttl = resource.expiresAt ? undefined : DEFAULT_TTL;
  const expiresAt = resource.expiresAt?.getTime() ?? now + DEFAULT_TTL;

  await persist(slug, {
    content: resource.content,
    contentType: resource.contentType,
    authorization: resource.authorization,
    createdAt: now,
    expiresAt,
    ttl,
  });
};

export const get = async (slug: string): Promise<Resource | undefined> => {
  const { value } = await kv.get<Resource>(key(slug));
  if (!value) return undefined;

  const now = Date.now();
  if (value.expiresAt <= now) {
    await kv.delete(key(slug));
    return undefined;
  }

  // Sliding expiration: each access pushes the deadline out by the TTL window.
  if (value.ttl !== undefined) {
    const refreshed = { ...value, expiresAt: now + value.ttl };
    await persist(slug, refreshed);
    return refreshed;
  }

  return value;
};

export const has = async (slug: string): Promise<boolean> => {
  // A bare existence probe (used for OPTIONS) — does not count as an access, so
  // it never slides the expiry.
  const { value } = await kv.get<Resource>(key(slug));
  return value !== null && value.expiresAt > Date.now();
};
