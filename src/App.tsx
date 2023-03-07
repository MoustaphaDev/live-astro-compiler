import { type Component, createSignal, createEffect } from "solid-js";
import { Header } from "~/components/Header";
import { Editor } from "~/components/Editor";
import "./index.css";
import "@fontsource/rampart-one";
import "@fontsource/fira-code";

const App: Component = () => {
  return (
    <div class="grid h-[50vh] w-screen grid-rows-[auto_1fr]">
      <Header />
      <Editor />
    </div>
  );
};

export default App;
