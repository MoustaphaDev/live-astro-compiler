/* @refresh reload */
import { render } from "solid-js/web";

// silence error until I find how to get rid of textmate errors
const _consoleErrorFn = console.error;
console.error = (...args) => {
  const err = args[0];
  const errorMessagesToSilence = ["Grammar is in an endless loop"];
  if (
    errorMessagesToSilence.some(
      (msg) =>
        (err?.message?.includes?.(msg) ||
          err?.includes?.(msg) ||
          err?.toString?.()?.includes?.(msg)) ??
        false,
    )
  )
    return;
  _consoleErrorFn(...args);
};

import App from "./App";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?",
  );
}

render(() => <App />, root!);
