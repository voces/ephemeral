import { baseUrl } from "../util/constants.ts";

export const statics: Record<string, ConstructorParameters<typeof Response>> = {
  "github.svg": [
    await fetch(`${baseUrl}/webapp/github.svg`).then((r) => r.text()),
    { headers: { "Content-Type": "image/svg+xml" } },
  ],
};
