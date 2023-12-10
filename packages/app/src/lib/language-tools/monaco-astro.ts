import * as monaco from "monaco-editor";
import { splitProps } from "solid-js";

export const loadGrammars = async (
  editor: monaco.editor.IStandaloneCodeEditor,
) => {
  const grammars = await import("./grammars");
  return grammars.loadGrammars(editor);
};

export async function createAstroEditor(
  domElement: HTMLElement,
  options: monaco.editor.IStandaloneEditorConstructionOptions,
) {
  const [local, rest] = splitProps(options, ["value"]);

  const editor = monaco.editor.create(domElement, {
    model: monaco.editor.createModel(
      local.value || "",
      "astro",
      monaco.Uri.parse("inmemory://model.astro"),
    ),
    ...rest,
  });

  await loadGrammars(editor);

  return editor;
}
