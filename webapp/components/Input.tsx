import { h, VNode, Fragment, useState } from "../../deps.ts";

export const Input = ({
  placeholder,
  label,
  dataListItems,
  name,
  initialValue,
  divStyle,
  inputStyle,
}: {
  placeholder: string;
  label?: VNode;
  dataListItems?: string[];
  name?: string;
  initialValue?: string;
  divStyle?: h.JSX.CSSProperties;
  inputStyle?: h.JSX.CSSProperties;
}) => {
  const [uniqueId] = useState(() => `Input--${Math.random().toString()}`);
  const input = (
    <input
      id={uniqueId}
      placeholder={placeholder}
      list={dataListItems ? `${uniqueId}-datalist` : undefined}
      name={name}
      value={initialValue}
      style={{ ...inputStyle }}
    />
  );
  const content = dataListItems ? (
    <>
      <datalist id={`${uniqueId}-datalist`}>
        {dataListItems.map((item) => (
          <option>{item}</option>
        ))}
      </datalist>
      {input}
    </>
  ) : (
    input
  );

  return label ? (
    <div style={{ display: "flex", flexDirection: "column", ...divStyle }}>
      <label for={uniqueId}>{label}</label>
      {content}
    </div>
  ) : (
    content
  );
};
