export const statics: Record<string, ConstructorParameters<typeof Response>> = {
  "github.svg": [
    await Deno.readTextFile("webapp/github.svg"),
    { headers: { "Content-Type": "image/svg+xml" } },
  ],
};
