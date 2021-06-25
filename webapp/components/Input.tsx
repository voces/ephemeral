import { h, VNode, Fragment, useState } from "../../deps.ts";

export const Input = ({
  placeholder,
  label,
  dataListItems,
  name,
  initialValue,
}: {
  placeholder: string;
  label?: VNode;
  dataListItems?: string[];
  name?: string;
  initialValue?: string;
}) => {
  const [uniqueId] = useState(() => `Input--${Math.random().toString()}`);
  const input = (
    <input
      id={uniqueId}
      placeholder={placeholder}
      list={dataListItems ? `${uniqueId}-datalist` : undefined}
      name={name}
      value={initialValue}
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
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label for={uniqueId}>{label}</label>
      {content}
    </div>
  ) : (
    content
  );
};
