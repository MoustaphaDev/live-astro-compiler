<center>
<h1>Live Astro Compiler</h1>
</center>

<center>
<h2>Preview the TypeScript output of Astro components</h2>
</center>


## Ideas

- [x] Add Monaco Editor
- [ ] Add Astro language server to editor (if possible?)
- [ ] Add a way to live preview changes to the compiler's source code
- [ ] Add possibility to change the compiler's parser and transform options
- [ ] Consider adding Web Containers to enable developping Astro sites side by side with the compiler output
- [ ] More...

## Changelog

- Make basic editor with a textarea and a shiki block as the compiler's transform output
- Make persistant storage for the editor
- Make shiki themes configurable
- Add option to see the compiler's parser output
- Make a brackets pair colorizer to make the textarea editor a bit prettier
- Drop the textarea+shiki combination and instead use the Monaco Editor