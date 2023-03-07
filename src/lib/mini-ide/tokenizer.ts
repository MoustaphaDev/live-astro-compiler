export type Token = OpenToken | CloseToken | TextToken;
export type OpenToken =
  | OpenCurlyBraceToken
  | OpenSquareBracketToken
  | OpenParenthesisToken;
export type CloseToken =
  | CloseCurlyBraceToken
  | CloseSquareBracketToken
  | CloseParenthesisToken;
export type TextToken = {
  type: "text";
  value: string;
};
export type OpenCurlyBraceToken = {
  type: "open";
  value: "{";
  kind: "curly";
};
export type CloseCurlyBraceToken = {
  type: "close";
  value: "}";
  kind: "curly";
};
export type OpenSquareBracketToken = {
  type: "open";
  value: "[";
  kind: "square";
};
export type CloseSquareBracketToken = {
  type: "close";
  value: "]";
  kind: "square";
};
export type OpenParenthesisToken = {
  type: "open";
  value: "(";
  kind: "parenthesis";
};
export type CloseParenthesisToken = {
  type: "close";
  value: ")";
  kind: "parenthesis";
};

const BRACKETS = "{[()]}" as const;

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < input.length; i++) {
    const letter = input[i];
    switch (letter) {
      case "{":
        tokens.push({ type: "open", value: letter, kind: "curly" });
        break;
      case "[":
        tokens.push({ type: "open", value: letter, kind: "square" });
        break;
      case "(":
        tokens.push({ type: "open", value: letter, kind: "parenthesis" });
        break;
      case "}":
        tokens.push({ type: "close", value: letter, kind: "curly" });
        break;
      case "]":
        tokens.push({ type: "close", value: letter, kind: "square" });
        break;
      case ")":
        tokens.push({ type: "close", value: letter, kind: "parenthesis" });
        break;
      default:
        // accumulate the letters until we hit a bracket
        let currentText = "";
        let j = i;
        while (j < input.length && !BRACKETS.includes(input[j])) {
          currentText += input[j];
          j++;
        }
        i = j - 1;
        tokens.push({ type: "text", value: currentText });
        break;
    }
  }
  return tokens;
}
