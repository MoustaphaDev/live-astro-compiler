<center>
  <h1>Live Astro Compiler</h1>
</center>

<center>
  <h2>Preview the compiled output of Astro components</h2>
</center>

## Roadmap

- Surface compiler errors in the UI
- Add a format button
- Display all transform outputs

```ts
interface TransformResult {
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
  propagation: boolean;
}
```

- Display all the TSX outputs

```ts
interface TSXResult {
  code: string; // only this is displayed currently
  map: SourceMap;
  diagnostics: DiagnosticMessage[];
}
```
