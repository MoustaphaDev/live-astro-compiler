import { type Component } from "solid-js";
import { Header } from "~/components/Header";
import { Editor } from "~/components/Editor";
import "./index.css";

// TODO: only import the fonts we need
import "@fontsource/fira-code";
import "@fontsource/montserrat";
import { BreakpointVisualizer } from "./components/BreakpointVisualizer";
// import { CompilerProvider } from "./components/CompilerProvider";

const originalDefineProperty = Object.defineProperty.bind(Object);
const patchOfDefineProperty = function (obj: any, prop: any, descriptor: any) {
  // check if the property defined in the object
  // if it's defined in `obj` then we don't need to define it again
  if (Object.prototype.hasOwnProperty.call(obj, prop)) {
    return obj;
  }

  // define the property using the original defineProperty
  return originalDefineProperty(obj, prop, descriptor);
};

Object.defineProperties = function <T>(
  obj: T,
  props: Record<string, PropertyDescriptor>,
) {
  for (const prop in props) {
    patchOfDefineProperty(obj, prop, props[prop]);
  }
  return obj;
};

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
