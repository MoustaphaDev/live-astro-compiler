import { describe, expect, it } from "vitest";
import { tokenize } from "./tokenizer";

describe("tokenizer", () => {
  const result = tokenize("foo { bar } baz [ qux ]");

  it("should tokenize when there are brackets", () => {
    expect(result).toEqual([
      { type: "text", value: "foo " },
      { type: "open", value: "{", kind: "curly" },
      { type: "text", value: " bar " },
      { type: "close", value: "}", kind: "curly" },
      { type: "text", value: " baz " },
      { type: "open", value: "[", kind: "square" },
      { type: "text", value: " qux " },
      { type: "close", value: "]", kind: "square" },
    ]);
    expect(result.length).toBe(8);
  });

  it("should tokenize when there are no brackets", () => {
    const result = tokenize("ddddddd");
    expect(result).toEqual([{ type: "text", value: "ddddddd" }]);
  });
});
