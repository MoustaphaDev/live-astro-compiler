import { ErrorBoundary, type Component } from "solid-js";
import { Header } from "~/components/Header";
import { Editor } from "~/components/Editor";
import "./index.css";

// TODO: only import the fonts we need
import "@fontsource/fira-code";
import "@fontsource/montserrat";
import { BreakpointVisualizer } from "./components/BreakpointVisualizer";
import { LoadingError } from "./components/ui-kit";

const App: Component = () => {
  return (
    <div class="grid h-screen w-screen grid-rows-[auto_1fr]">
      <ErrorBoundary fallback={<LoadingError />}>
        <Header />
      </ErrorBoundary>
      <Editor />
      {import.meta.env.DEV && <BreakpointVisualizer />}
    </div>
  );
};

export default App;
