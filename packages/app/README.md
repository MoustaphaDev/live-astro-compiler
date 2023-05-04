<center>
<h1>Live Astro Compiler</h1>
</center>

<center>
<h2>Preview the TypeScript output of Astro components</h2>
</center>

## TODO

- Nicely display errors in the UI
- Add `resolvePath` and `preprocessStyle` transform options
- Add a prettier formatter button
- Add theme switcher
- Add view displaying all resulting properties of a transform. The result of a transform has this shape

```ts
export interface TransformResult {
  code: string; // only this is displayed currently
  map: string;
  scope: string;
  styleError: string[];
  diagnostics: DiagnosticMessage[];
  css: string[];
  scripts: HoistedScript[];
  hydratedComponents: HydratedComponent[];
  clientOnlyComponents: HydratedComponent[];
  containsHead: boolean;
}
```
