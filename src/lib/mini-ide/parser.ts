import { CloseToken, OpenToken, TextToken, Token, tokenize } from "./tokenizer";

export type OpenParsedToken = OpenToken & { color: string };
export type CloseParsedToken = CloseToken & { color: string };
export type ParsedToken = OpenParsedToken | CloseParsedToken;
export type ParseResult = (ParsedToken | TextToken)[];

const COLORS = ["#0000ff", "#ffff00", "#ff00ff"];
function* colorSeeder(): Generator<string, string, string> {
  let index = 0;
  while (true) {
    yield COLORS[index++ % 3];
  }
}

export function parse(input: string) {
  const tokens = tokenize(input);
  const colorGenerator = colorSeeder();
  const openBracketsStack: OpenParsedToken[] = [];
  const result: ParseResult = [];
  for (const token of tokens) {
    switch (token.type) {
      case "open":
        const openParsedToken = {
          ...token,
          color: colorGenerator.next().value,
        };
        openBracketsStack.push(openParsedToken);
        result.push(openParsedToken);
        break;
      case "close":
        if (openBracketsStack.length === 0) {
          //   Unmatched close bracket, take as text
          console.warn("Unmatched close bracket");
          result.push({ type: "text", value: token.value });
          break;
        }
        const open = openBracketsStack.pop()!;
        if (open.kind !== token.kind) {
          //   Mismatched brackets, take as text
          console.warn("Mismatched brackets");
          result.push({ type: "text", value: token.value });
          break;
        }
        result.push({ ...token, color: open.color });
        break;
      case "text":
        result.push(token);
        break;
    }
  }
  return result;
}
