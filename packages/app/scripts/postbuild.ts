import { execSync } from "child_process";
import { sync as globSync } from "glob";
import { readFileSync, writeFileSync } from "fs";

// HACK: textmate which I use for syntax highlighting of the astro syntax
// causes a bug that I can't figure out how to fix, so I just remove
// the snippets that cause the bug
const SNIPPETS_CAUSING_ANNOYING_BUGS = [
  [
    'typeof process === "undefined" ? false : !!process.env["VSCODE_TEXTMATE_DEBUG"];',
    "false",
  ],
  [
    '"undefined" != typeof process && !!process.env.VSCODE_TEXTMATE_DEBUG',
    "false",
  ],
  [
    "typeof process !== 'undefined' && !!process.env['VSCODE_TEXTMATE_DEBUG']",
    "false",
  ],
  [`typeof process > "u" ? !1 : !!process.env.VSCODE_TEXTMATE_DEBUG;`, "false"],
  [`process.env.VSCODE_TEXTMATE_DEBUG`, "false"],
  ["#! /usr/bin/env node", ""],
];

// Find all JavaScript files in the dist directory
const files = globSync("dist/**/*.js");

// Modify each file in place

files.forEach((file) => {
  const content = readFileSync(file, "utf-8");
  let newContent;
  for (const snippet of SNIPPETS_CAUSING_ANNOYING_BUGS) {
    if (content.includes(snippet[0])) {
      newContent = content.replaceAll(snippet[0], snippet[1]);
    }
  }
  if (!newContent) {
    return;
  }
  writeFileSync(file, newContent);
});

execSync("cp -r public/* dist/", { stdio: "inherit" });
