
// after the compiler module and wasm are loaded
// we can assume that the compiler module and
// wasm are defined

function utf16ToUTF8(x: string)
{
  return unescape(encodeURIComponent(x));
}

// adapted from https://github.com/evanw/source-map-visualization/blob/gh-pages/code.js#L1621
async function createSourcemapHash(code: string | undefined)
{
  // Check for both "//" and "/*" comments
  if (!code) {
    console.warn(`No code was pasted`);
    return;
  }
  let match = /\/(\/)[#@] *sourceMappingURL=([^\s]+)/.exec(code);
  if (!match)
    match =
      /\/(\*)[#@] *sourceMappingURL=((?:[^\s*]|\*[^/])+)(?:[^*]|\*[^/])*\*\//.exec(
        code
      );

  // Check for a non-empty data URL payload
  if (!match) {
    console.warn(
      `Failed to find an embedded "//}# sourceMappingURL=" comment in the pasted text'`
    );
    return;
  }
  if (!match[2]) {
    console.warn(
      `Failed to find an embedded "/${match[1]}# sourceMappingURL=" comment in the pasted text'`
    );
    return;
  }

  let map;
  try {
    // Use "new URL" to ensure that the URL has a protocol (e.g. "data:" or "https:")
    map = await fetch(new URL(match[2])).then((r) => r.text());
  } catch (e) {
    console.warn(
      `Failed to parse the URL in the "/${match[1]
      // @ts-expect-error
      }# sourceMappingURL=" comment: ${(e && e.message) || e}`
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

export async function createSourcemapURL(source: string | undefined)
{
  if (source === undefined) return;

  const hash = await createSourcemapHash(source);
  const hasError = !hash;
  const url = `https://evanw.github.io/source-map-visualization/#${hash}`;
  if (!hasError) {
    return url;
  }
  console.error("Failed to create hash from compiled code");
}
