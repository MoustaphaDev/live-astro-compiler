/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RELATIVE_PATH_TO_COMPILER_DIST_FOLDER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
