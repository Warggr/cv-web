import Handlebars from "handlebars";

// Import raw template and stylesheets from template-source
import templateSource from "../../template-source/template.handlebars?raw";
import fontsCss from "../../template-source/resources/fonts.css?raw";
import semanticsCss from "../../template-source/resources/semantics.css?raw";
import columnsCss from "../../template-source/resources/columns.css?raw";
import styleCss from "../../template-source/resources/style.css?raw";
import editorCss from "../../template-source/resources/editor.css?raw";

// Import locales
import enLocale from "../../template-source/locales/en.json";
import deLocale from "../../template-source/locales/de.json";
import frLocale from "../../template-source/locales/fr.json";

const locales = {
  en: enLocale,
  de: deLocale,
  fr: frLocale,
};

const stylesheets = {
  "fonts.css": fontsCss,
  "semantics.css": semanticsCss,
  "columns.css": columnsCss,
  "style.css": styleCss,
  "editor.css": editorCss,
};

export function render(resume, options = {}) {
  const lang = options.lang || resume?.meta?.lang || "en";
  const translations = locales[lang] || locales.en;

  // Create an isolated Handlebars environment
  const hbs = Handlebars.create();

  hbs.registerHelper("css", function (sheetname) {
    const contents = stylesheets[sheetname] || "";
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

  const compiled = hbs.compile(templateSource, { noEscape: true });
  return compiled({ resume });
}

export default {
  name: "warggr",
  label: "Warggr (Handlebars)",
  render,
};
