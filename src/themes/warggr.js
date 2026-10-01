import Handlebars from "handlebars";

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/Warggr/cv-template/master";

const RESOURCE_FILES = [
  "fonts.css",
  "semantics.css",
  "columns.css",
  "style.css",
  "editor.css",
];

// In-memory cache for GitHub assets
let cachedTemplate = null;
const cachedResources = {};
const cachedLocales = {};

export async function fetchWarggrAssets() {
  const fetches = [];

  // Fetch template.handlebars if not cached
  if (!cachedTemplate) {
    fetches.push(
      fetch(`${GITHUB_RAW_BASE}/template.handlebars`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} fetching template`);
          return r.text();
        })
        .then((text) => {
          cachedTemplate = text;
        }),
    );
  }

  // Fetch stylesheets if not cached
  for (const file of RESOURCE_FILES) {
    if (!cachedResources[file]) {
      fetches.push(
        fetch(`${GITHUB_RAW_BASE}/resources/${file}`)
          .then((r) => (r.ok ? r.text() : ""))
          .then((text) => {
            cachedResources[file] = text;
          }),
      );
    }
  }

  // Fetch all standard locales
  for (const lang of ["en", "de", "fr"]) {
    if (!cachedLocales[lang]) {
      fetches.push(
        fetch(`${GITHUB_RAW_BASE}/locales/${lang}.json`)
          .then((r) => (r.ok ? r.json() : {}))
          .then((json) => {
            cachedLocales[lang] = json;
          })
          .catch(() => {
            cachedLocales[lang] = {};
          }),
      );
    }
  }

  await Promise.all(fetches);
}

export async function render(resume, options = {}) {
  await fetchWarggrAssets();

  const lang = options.lang || resume?.meta?.lang || "en";
  const translations = cachedLocales[lang] || cachedLocales.en || {};

  const hbs = Handlebars.create();

  hbs.registerHelper("css", function (sheetname) {
    const contents = cachedResources[sheetname] || "";
    return new hbs.SafeString(
      `<style data-sheet="${sheetname}">${contents}</style>`,
    );
  });

  hbs.registerHelper("toLowerCase", function (str) {
    return (str || "").toLowerCase();
  });

  hbs.registerHelper("i18n", function (key) {
    return translations[key] ?? key;
  });

  let regionNames;
  try {
    regionNames = new Intl.DisplayNames([lang], { type: "region" });
  } catch (e) {
    regionNames = null;
  }

  hbs.registerHelper("toCountryName", function (code) {
    if (!code) return "";
    return regionNames ? regionNames.of(code) || code : code;
  });

  const compiled = hbs.compile(cachedTemplate, { noEscape: true });
  return compiled({ resume });
}

export default {
  id: "warggr",
  name: "Warggr (GitHub origin)",
  type: "handlebars",
  render,
};
