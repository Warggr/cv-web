# Static CV Web App & Live Side-by-Side Editor

A browser-based side-by-side JSON Resume editor and live renderer:

- **Left Panel:** Editable JSON document with syntax validation, soft tabs (2 spaces), and error reporting.
- **Right Panel:** Live rendered CV with support for language presets (`EN`, `DE`, `FR`), URL loading, local file upload, and instant re-compilation (<kbd>Ctrl+Enter</kbd> / <kbd>Cmd+Enter</kbd>).
- **Theme Switcher:** Switch between themes on the fly:
  - `Warggr`: Loaded dynamically directly from the [Warggr/cv-template](https://github.com/Warggr/cv-template) GitHub repository.
  - `Flat`: Loaded directly from npm/unpkg (`jsonresume-theme-flat`).
  - `Paper`: Loaded directly from npm/unpkg (`jsonresume-theme-paper`).
- **Zero Local Copies:** Template source and stylesheets are fetched dynamically at runtime, removing duplicated template files from this repo.

## Development / Live Preview

Install dependencies once, then start Vite:

```sh
npm install
npm run dev
```

Open `http://localhost:8080`.

## Build for Production (GitHub Pages)

Compile static assets:

```sh
npm run build
```

This generates `dist/`, which is completely self-contained and ready to be deployed to GitHub Pages or any static host.

To preview the build locally:

```sh
npm run preview
```
