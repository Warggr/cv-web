import * as macchiato from "jsonresume-theme-macchiato";
import * as bold_header_statement from "jsonresume-theme-bold-header-statement";
import * as warggr from "jsonresume-theme-warggr";
import * as warggr_tabular from "jsonresume-theme-warggr-tabular";

import { loadTheme } from "./load_themes.js";

export let themes = {};

let themesToLoad = {
  Macchiato: macchiato,
  "Bold Header Statement": bold_header_statement,
  warggr: warggr,
  "warggr-tabular": warggr_tabular,
};

async function _loadDefaultThemes() {
  for (let [themeName, theme] of Object.entries(themesToLoad)) {
    if (theme.NOT_BUNDLED !== undefined) {
      console.warn("Could not load", themeName);
    } else {
      console.warn("Loaded", theme.render);
      themes[themeName + " (bundled)"] = theme.render;
    }
  }

  let external_themes = localStorage.getItem("external-themes") || "[]";
  external_themes = JSON.parse(external_themes);
  for (let theme of external_themes) {
    themes[theme.name] = await loadTheme(theme);
  }
}

const default_themes_loaded = _loadDefaultThemes();

export async function loadDefaultThemes() {
  await default_themes_loaded;
  return themes;
}

export async function renderTheme(themeId, resume, options = {}) {
  const render = themes[themeId] || themes["Macchiato"];
  if (render === undefined) {
    return `<h1>Error: Theme not found</h1><br/>Loaded themes: ${Object.keys(themes)}`;
  }
  return await render(resume, options);
}
