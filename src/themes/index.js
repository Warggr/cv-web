import warggr from "./warggr.js";
import flat from "./flat.js";
import paper from "./paper.js";

export const themes = {
  warggr,
  flat,
  paper,
};

export const themeList = [
  { id: "warggr", name: "Warggr (GitHub origin)" },
  { id: "flat", name: "Flat (npm / unpkg)" },
  { id: "paper", name: "Paper (npm / unpkg)" },
];

export async function renderTheme(themeId, resume, options = {}) {
  const theme = themes[themeId] || themes.warggr;
  return await theme.render(resume, options);
}
