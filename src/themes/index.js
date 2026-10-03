import * as macchiato from "jsonresume-theme-macchiato";
import * as bold_header_statement from "jsonresume-theme-bold-header-statement";
import * as warggr from "jsonresume-theme-warggr";
import * as warggr_tabular from "jsonresume-theme-warggr-tabular";

let themes = {};

export async function loadTheme(name, url) {
  try {
    const { render } = await import(url /* @vite-ignore */);
    themes[name] = render;
  } catch (err) {
    console.error(`Could not load theme ${name}: ${err}`);
  }
}

let themesToLoad = {
  Macchiato: macchiato,
  "Bold Header Statement": bold_header_statement,
  warggr: warggr,
  "warggr-tabular": warggr_tabular,
};

for (let [themeName, theme] of Object.entries(themesToLoad)) {
  if (theme.NOT_BUNDLED !== undefined) {
    console.warn("Could not load", themeName);
  } else {
    console.warn("Loaded", theme.render);
    themes[themeName + " (bundled)"] = theme.render;
  }
}

export async function loadDefaultThemes() {
  return themes;
}

export async function renderTheme(themeId, resume, options = {}) {
  const render = themes[themeId] || themes["Macchiato"];
  console.warn(themes);
  if (render === undefined) {
    return `<h1>Error: Theme not found</h1><br/>Loaded themes: ${Object.keys(themes)}`;
  }
  return await render(resume, options);
}
