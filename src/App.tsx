import type { Component } from "solid-js";
import { Header } from "~/components/Header";

const App: Component = () => {
  return (
    <div class="grid h-screen w-screen grid-rows-[auto_1fr]">
      <Header />
    </div>
  );
};

export default App;
