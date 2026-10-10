import { inflate } from "pako";
import untar from "js-untar";
const { registerFiles } = await import(/* @vite-ignore */ "/fs-polyfill.js");

import * as macchiato from "jsonresume-theme-macchiato";
import * as bold_header_statement from "jsonresume-theme-bold-header-statement";
import * as warggr from "jsonresume-theme-warggr";
import * as warggr_tabular from "jsonresume-theme-warggr-tabular";

const ESM_BASE = "https://esm.sh/";
const NPM_BASE = "https://registry.npmjs.org/";

export let themes = {};

let bundledThemes = {
  Macchiato: macchiato,
  "Bold Header Statement": bold_header_statement,
  warggr: warggr,
  "warggr-tabular": warggr_tabular,
};

export async function getThemeUrl(theme) {
  const name = theme.package.name;
  const version = theme.package.version;

  // esm.sh will resolve the package and its dependencies.
  const url = `${ESM_BASE}${name}@${version}?external=node:fs,fs`;
  const npm_url = `${NPM_BASE}${name}/${version}`;
  const tarball_url = (await fetch(npm_url).then((res) => res.json())).dist
    .tarball;

  return { name, url, tarball_url, version };
}

async function registerFilesForModule(theme) {
  const files = await fetch(theme.tarball_url)
    .then((res) => res.arrayBuffer())
    .then(inflate)
    .then((arr) => arr.buffer)
    .then(untar);
  registerFiles(theme, files);
}

export async function loadTheme(theme) {
  if (theme.bundled !== undefined) {
    const module = bundledThemes[theme.bundled];
    if (theme.NOT_BUNDLED !== undefined) {
      throw new Error(`Optional dependency ${theme.name} not bundled`);
    }
    return module.render;
  } else {
    console.debug(`Loading ${theme.name} from ${theme.url}`);
    await registerFilesForModule(theme);
    const module = await import(/* @vite-ignore */ theme.url);

    if (typeof module.render !== "function") {
      throw new Error("Theme does not export a render() function");
    }
    return module.render;
  }
}

export function getBundledThemes() {
  let themesDescr = [];
  for (let [themeName, theme] of Object.entries(bundledThemes)) {
    themesDescr.push({
      name: themeName + " (bundled)",
      bundled: themeName,
    });
  }
  return themesDescr;
}

export function getStarredThemeDescrs() {
  let themesDescr = localStorage.getItem("themes");
  if (themesDescr !== null) {
    return JSON.parse(themesDescr);
  } else {
    return getBundledThemes();
  }
}

async function _loadDefaultThemes() {
  let themesDescr = getStarredThemeDescrs();
  for (let theme of themesDescr) {
    try {
      themes[theme.name] = await loadTheme(theme);
      // console.warn(name, themes[theme.name]);
    } catch (err) {
      console.error(`Could not load ${theme.name}: ${err}`);
    }
  }
}

// Used by many themes
await getThemeUrl({
  package: { name: "resume-schema", version: "0.0.15" },
})
  .then(registerFilesForModule)
  .catch(console.error);

const default_themes_loaded = _loadDefaultThemes();

export async function loadDefaultThemes() {
  await default_themes_loaded;
  return themes;
}
