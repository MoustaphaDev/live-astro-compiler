import { type Component, createSignal, createEffect } from "solid-js";
import { Header } from "~/components/Header";
import { Editor } from "~/components/Editor";
import "./index.css";
import "@fontsource/rampart-one";
import "@fontsource/fira-code";
import { TokenDisplay } from "./lib/mini-ide/printer";
import { parse } from "./lib/mini-ide/parser";

const App: Component = () => {
  const [code, setCode] = createSignal("");
  const parsedCode = () => parse(code());

  createEffect(() => {
    console.log("Parsed code:", parsedCode());
    console.log("Code:", code());
  });

  return (
    <>
      <div class="grid h-[50vh] w-screen grid-rows-[auto_1fr]">
        <Header />
        <Editor />
      </div>
      <div class="grid h-[50vh] w-screen grid-cols-2">
        <textarea onInput={(e) => setCode(e.currentTarget.value)} />
        <TokenDisplay parseResult={parsedCode()} />
      </div>
    </>
  );
};

export default App;
