import { type Component } from "solid-js";
import { Header } from "~/components/Header";
import { Editor } from "~/components/Editor";
import "./index.css";

// TODO: only import the fonts we need
import "@fontsource/fira-code";
import "@fontsource/montserrat";
import { BreakpointVisualizer } from "./components/BreakpointVisualizer";
// import { CompilerProvider } from "./components/CompilerProvider";

// HACK: patch the defineProperty method to not throw errors
// HACK: we're patching the defineProperties method
// not throw errors, but just logs them instead
// thinking about just silencing the errors
// when loading multiple compiler versions, we got an error
// that the `fs` property was already defined
const originalDefineProperty = Object.defineProperty.bind(Object);
const patchDefineProperty = function (obj, prop, descriptor) {
  const propsToIgnore = ["fs", "process"];
  // @ts-ignore
  if (propsToIgnore.includes(prop)) {
    console.log("Ignoring defineProperty for ", prop);
    return;
  }
  originalDefineProperty(obj, prop, descriptor);
} as typeof Object.defineProperty;
Object.defineProperty = patchDefineProperty;

Object.defineProperties = function (
  obj: any,
  props: Record<string, PropertyDescriptor>,
) {
  const propsToIgnore = ["fs", "process"];
  Object.entries(props).forEach(([prop, descriptor]) => {
    if (propsToIgnore.includes(prop)) {
      console.log("Ignoring defineProperty for ", prop);
      return;
    }
    originalDefineProperty(obj, prop, descriptor);
  });
} as typeof Object.defineProperties;

const App: Component = () => {
  return (
    <div class="grid h-screen w-screen grid-rows-[auto_1fr]">
      {/* <CompilerProvider> */}
      <Header />
      <Editor />
      {/* </CompilerProvider> */}
      {import.meta.env.DEV && <BreakpointVisualizer />}
    </div>
  );
};

export default App;
