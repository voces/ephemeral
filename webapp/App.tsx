import { h, Fragment } from "../deps.ts";
import { Input } from "./components/Input.tsx";
import { commonContentTypes } from "./commonContentTypes.ts";
import { adjectives } from "./adjectives.ts";
import { nouns } from "./nouns.ts";

const random = <T extends unknown>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const App = () => (
  <>
    <header>
      <span style={{ fontSize: "125%", fontStyle: "italic" }}>ephemeral</span>
    </header>
    <form
      style={{
        margin: "auto",
        width: "min(64em, 90%)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      method="POST"
    >
      <textarea
        name="body"
        style={{
          width: "calc(100% - 0.5em - 2px)",
          height: "min(100%, 32em)",
          minWidth: "calc(100% - 0.5em - 2px)",
          minHeight: "4em",
        }}
        placeholder={JSON.stringify({ foo: "bar" }, null, 2)}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.25em",
          alignItems: "flex-end",
          marginBottom: "1em",
          marginTop: "0.25em",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <Input name="password" label="Password" />
        <Input
          name="path"
          placeholder="file.json"
          initialValue={`${random(adjectives)}-${random(nouns)}`}
          label="Slug"
          divStyle={{ flexShrink: 1 }}
          inputStyle={{ width: "calc(100% - 0.5em - 2px)" }}
        />
        <Input
          name="contenttype"
          placeholder="text/plain"
          label="Content type"
          dataListItems={commonContentTypes}
          divStyle={{ flexShrink: 1 }}
          inputStyle={{ width: "calc(100% - 0.5em - 2px)" }}
        />
        <button type="submit">Submit</button>
      </div>
    </form>
  </>
);
