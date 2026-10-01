# Static CV web app

A dependency-free, static site that renders the English, German, and French CV JSON files in `data/`.

## Preview

Install the development tools once, then run the bundled zero-runtime-dependency server:

```sh
npm install
npm run serve
```

Open `http://localhost:8080`. A local server is needed because browsers do not allow `fetch()` calls from `file://` pages. To choose another port, use `PORT=3000 npm run serve`.

`npm install` only installs Prettier for development. The site and local server use Node's built-in modules, so there are no runtime dependencies.

## Formatting and hooks

The project follows the same Prettier hook configuration as `template/`. Install the hook once (after installing [pre-commit](https://pre-commit.com/)):

```sh
pre-commit install
```

Use `npm run format` to format manually or `npm run format:check` in CI.

## Deploy

Publish the contents of this `cv-web` folder to any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.). There is no build step or server component. The language can be linked directly, for example `/?lang=de`.

## Update CV content

Replace the matching files under `data/` with refreshed generated JSON files. The app intentionally owns these copies so deployment remains self-contained.
