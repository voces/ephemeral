export const statics: Record<string, ConstructorParameters<typeof Response>> = {
  "github.svg": [
    await Deno.readTextFile(new URL("./github.svg", import.meta.url)),
    { headers: { "Content-Type": "image/svg+xml" } },
  ],
};
