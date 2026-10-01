# Static CV web app

Static CV web app that dynamically renders English, German, and French JSON-Resume files in the browser using Handlebars and the custom JSON Resume template theme.

## Development / Live Preview

Install dependencies once, then start the Vite development server:

```sh
npm install
npm run dev
```

Open `http://localhost:8080`. Changes to styles or templates will hot-reload automatically.

## Build for Production (GitHub Pages)

Build the static distribution:

```sh
npm run build
```

This compiles the assets into `dist/`. The output files are self-contained and use relative asset paths (`base: './'`), so `dist/` can be deployed directly to GitHub Pages, Cloudflare Pages, or Netlify.

To test the production build locally:

```sh
npm run preview
```

## Adding / Switching Themes

Themes live in `src/themes/`. The default theme (`warggr`) compiles `template-source/template.handlebars` with Handlebars and registers translation & helper utilities. Additional JSON-Resume Handlebars themes can be placed alongside it.

## Update CV Content

Update the JSON files under `public/data/` (or `data/`). The build copies `public/data/` straight into `dist/data/`.
