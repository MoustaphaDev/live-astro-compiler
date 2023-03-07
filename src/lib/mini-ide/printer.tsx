import { ParseResult } from "./parser";
import { ComponentProps, For, splitProps } from "solid-js";

type Props = ComponentProps<"div"> & {
  parseResult: ParseResult;
};

function CaracterToHTML(props: { children: string }) {
  switch (props.children[0]) {
    case "\n":
      console.log("New line");
      return <span class="block">{props.children}</span>;
    case "\t":
      return <span>&#x21e5; {props.children}</span>;
    default:
      return <span>{props.children}</span>;
  }
}

export function TokenDisplay(props: Props) {
  const [local, others] = splitProps(props, ["parseResult"]);
  return (
    <div {...others}>
      <For each={local.parseResult}>
        {(parsedToken) => {
          switch (parsedToken.type) {
            case "open":
            case "close":
              return (
                <span style={`color:${parsedToken.color}`}>
                  {parsedToken.value}
                </span>
              );
            case "text":
              return <CaracterToHTML>{parsedToken.value}</CaracterToHTML>;
          }
        }}
      </For>
    </div>
  );
}
