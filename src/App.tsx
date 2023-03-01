import type { Component } from "solid-js";
import { Header } from "~/components/Header";
import { Editor } from "~/components/Editor";

const App: Component = () => {
  return (
    <div class="grid h-screen w-screen grid-rows-[auto_1fr]">
      <Header />
      <Editor />
    </div>
  );
};

export default App;
