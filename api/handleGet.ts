import { get } from "../store.ts";
import { Params } from "./parseRequestParams.ts";

export const handleGet = ({ slug }: Params) => {
  const existingContent = get(slug);
  if (!existingContent) {
    return new Response("not found", { status: 404 });
  } else {
    return new Response(existingContent.content, {
      headers: { "Content-Type": existingContent.contentType },
    });
  }
};
