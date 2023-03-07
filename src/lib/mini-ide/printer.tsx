import { ParseResult } from "./parser";
import { For } from "solid-js";

type Props = {
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
  return (
    <div class="">
      <For each={props.parseResult}>
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
