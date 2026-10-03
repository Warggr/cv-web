let themes = {};

export async function loadTheme(name, url) {
  try {
    const { render } = await import(url /* vite-ignore */);
    themes[name] = render;
  } catch (err) {
    console.error(`Could not load theme ${name}: ${err}`);
  }
}

let themesToLoad = {
  "Desert Modern": "https://esm.unpkg.com/jsonresume-theme-desert-modern@0.1.5",
  "Academic CV Lite":
    "https://esm.unpkg.com/jsonresume-theme-academic-cv-lite@0.2.4",
};

let promises = [];
for (let [themeName, themeUrl] of Object.entries(themesToLoad)) {
  promises.push(loadTheme(themeName, themeUrl));
}
let all_themes_loaded = Promise.all(promises);

export async function loadDefaultThemes() {
  await all_themes_loaded;
  return themes;
}

export async function renderTheme(themeId, resume, options = {}) {
  await all_themes_loaded;
  const render = themes[themeId] || themes["Desert Modern"];
  console.warn(themes);
  if (render === undefined) {
    return `<h1>Error: Theme not found</h1><br/>Loaded themes: ${Object.keys(themes)}`;
  }
  return await render(resume, options);
}
