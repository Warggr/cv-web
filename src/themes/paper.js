import Handlebars from "handlebars";

let cachedTemplate = null;
let cachedCss = null;
let cachedPrintCss = null;

const UNPKG_BASE = "https://unpkg.com/jsonresume-theme-paper@0.5.0";

export async function render(resume) {
  if (!cachedTemplate || !cachedCss || !cachedPrintCss) {
    const [tplRes, cssRes, printRes] = await Promise.all([
      fetch(`${UNPKG_BASE}/resume.template`),
      fetch(`${UNPKG_BASE}/css/style.css`),
      fetch(`${UNPKG_BASE}/css/print.css`),
    ]);
    cachedTemplate = await tplRes.text();
    cachedCss = await cssRes.text();
    cachedPrintCss = await printRes.text();
  }

  const hbs = Handlebars.create();

  // Register helpers according to jsonresume-theme-paper
  hbs.registerHelper("foreach", function (arr, options) {
    if (!arr || !arr.length) {
      return options.inverse ? options.inverse(this) : "";
    }
    return arr
      .map(function (item, index) {
        const cloned = Object.assign({}, item);
        cloned.$index = index;
        cloned.$first = index === 0;
        cloned.$notfirst = index !== 0;
        cloned.$last = index === arr.length - 1;
        return options.fn(cloned);
      })
      .join("");
  });

  hbs.registerHelper("ifCond", function (v1, operator, v2, options) {
    switch (operator) {
      case "==":
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      case "===":
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case "<":
        return v1 < v2 ? options.fn(this) : options.inverse(this);
      case "<=":
        return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case ">":
        return v1 > v2 ? options.fn(this) : options.inverse(this);
      case ">=":
        return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case "&&":
        return v1 && v2 ? options.fn(this) : options.inverse(this);
      case "||":
        return v1 || v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  });

  hbs.registerHelper("commalist", function (items, options) {
    if (!items || !items.length) return "";
    return options.fn(items.join(", "));
  });

  return hbs.compile(cachedTemplate)({
    css: cachedCss,
    print: cachedPrintCss,
    resume: resume,
  });
}

export default {
  id: "paper",
  name: "Paper (npm / unpkg)",
  type: "handlebars",
  render,
};
