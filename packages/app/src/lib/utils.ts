function utf16ToUTF8(x: string) {
  return unescape(encodeURIComponent(x));
}

// adapted from https://github.com/evanw/source-map-visualization/blob/gh-pages/code.js#L1621
async function createSourcemapHash(code: string | undefined) {
  // Check for both "//" and "/*" comments
  if (!code) {
    console.warn(`No code was pasted`);
    return;
  }
  let match = /\/(\/)[#@] *sourceMappingURL=([^\s]+)/.exec(code);
  if (!match)
    match =
      /\/(\*)[#@] *sourceMappingURL=((?:[^\s*]|\*[^/])+)(?:[^*]|\*[^/])*\*\//.exec(
        code,
      );

  // Check for a non-empty data URL payload
  if (!match) {
    console.warn(
      `Failed to find an embedded "//}# sourceMappingURL=" comment in the pasted text'`,
    );
    return;
  }
  if (!match[2]) {
    console.warn(
      `Failed to find an embedded "/${match[1]}# sourceMappingURL=" comment in the pasted text'`,
    );
    return;
  }

  let map;
  try {
    // Use "new URL" to ensure that the URL has a protocol (e.g. "data:" or "https:")
    map = await fetch(new URL(match[2])).then((r) => r.text());
  } catch (e) {
    console.warn(
      `Failed to parse the URL in the "/${
        match[1]
        // @ts-expect-error
      }# sourceMappingURL=" comment: ${(e && e.message) || e}`,
    );
    return;
  }

  code = utf16ToUTF8(code);
  map = utf16ToUTF8(map);

  let codeLength = `${code.length}\0`;
  let mapLength = `${map.length}\0`;
  const hash = btoa(`${codeLength}${code}${mapLength}${map}`);
  return hash;
}

export async function createSourcemapURL(source: string | undefined) {
  if (source === undefined) return;

  const hash = await createSourcemapHash(source);
  const hasError = !hash;
  const url = `https://evanw.github.io/source-map-visualization/#${hash}`;
  if (!hasError) {
    return url;
  }
  console.error("Failed to create hash from compiled code");
}

export function patchGlobals() {
  patchConsole();
  patchDefineProperties();
}

/** Silence textmate error until I find how to get rid of them */
function patchConsole() {
  const originalConsoleErrorFn = console.error.bind(console);
  console.error = (...args) => {
    const err = args[0];
    const textmateErrorMessages = ["Grammar is in an endless loop"];
    if (
      textmateErrorMessages.some(
        (msg) =>
          (err?.message?.includes?.(msg) ||
            err?.includes?.(msg) ||
            err?.toString?.()?.includes?.(msg)) ??
          false,
      )
    )
      return;
    originalConsoleErrorFn(...args);
  };
}

/**
 * HACK: we're patching the defineProperties method
to avoid defining twice the `fs` and `process` properties.
When subsequently loading compiler versions, the `wasm_exec.js` module
from the compiler will try to define the `fs` and `process`
properties again which will throw an error.
This is a hack to avoid this error
*/
function patchDefineProperties() {
  const propsToAvoidDefiningTwice = new Set(["fs", "process"]);
  const patchOfDefineProperty = function (
    obj: any,
    prop: any,
    descriptor: any,
  ) {
    // check if the property defined in the object
    // if it's defined in `obj` then we don't need to define it again
    if (
      propsToAvoidDefiningTwice.has(prop) &&
      Object.prototype.hasOwnProperty.call(obj, prop)
    ) {
      return obj;
    }
    // define the property using the original defineProperty method
    return Object.defineProperty(obj, prop, descriptor);
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
}

export function createNoopAfterFirstCall(fn: () => void) {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    return fn();
  };
}
