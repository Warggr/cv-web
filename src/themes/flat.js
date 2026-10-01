import Handlebars from "handlebars";

let cachedTemplate = null;
let cachedCss = null;

const UNPKG_BASE = "https://unpkg.com/jsonresume-theme-flat@0.3.7";

export async function render(resume) {
  if (!cachedTemplate || !cachedCss) {
    const [tplRes, cssRes] = await Promise.all([
      fetch(`${UNPKG_BASE}/resume.template`),
      fetch(`${UNPKG_BASE}/style.css`),
    ]);
    cachedTemplate = await tplRes.text();
    cachedCss = await cssRes.text();
  }

  const hbs = Handlebars.create();

  hbs.registerHelper("nl2br", function (value) {
    return (value || "").replace(/\n/g, "</p><p>");
  });

  return hbs.compile(cachedTemplate)({
    css: cachedCss,
    resume: resume,
  });
}

export default {
  id: "flat",
  name: "Flat (npm / unpkg)",
  type: "handlebars",
  render,
};
