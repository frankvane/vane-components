{
  "name": "__PKG_NAME__",
  "version": "0.1.0",
  "description": "__DESC__",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {},
  "files": [
    "dist"
  ],
  "sideEffects": false,
  "publishConfig": {
    "access": "public"
  },
  "keywords": [
    "react",
    "plugin",
    "__NAME_KEBAB__",
    "typescript"
  ],
  "author": "Frank Vane",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/frankvane/vane-components.git",
    "directory": "packages/__PKG_NAME__"
  },
  "scripts": {
    "dev": "vite --config demo/vite.config.ts",
    "build": "vite build --mode lib",
    "build:demo": "vite build --config demo/vite.config.ts",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint .",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0",
    "vane-plugin-core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vane/build-config": "workspace:*",
    "vane-plugin-core": "workspace:*",
    "@vane/tsconfig": "workspace:*",
    "@vitejs/plugin-react": "^4.3.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.1",
    "vite-plugin-dts": "^4.5.4",
    "vitest": "^2.1.8",
    "@vane/vitest-config": "workspace:*",
    "@vane/eslint-config": "workspace:*"
  }
}
