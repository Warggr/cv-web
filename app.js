const files = {
  en: "resume-main.json",
  de: "resume-main-DE.json",
  fr: "resume-main-FR.json",
};
const labels = {
  en: {
    education: "Education",
    work: "Experience",
    projects: "Projects",
    volunteer: "Volunteering",
    awards: "Awards",
    skills: "Skills",
    languages: "Languages",
    interests: "Interests",
    relevant: "Relevant coursework",
    contact: "Contact",
  },
  de: {
    education: "Ausbildung",
    work: "Berufserfahrung",
    projects: "Projekte",
    volunteer: "Ehrenamt",
    awards: "Auszeichnungen",
    skills: "Kenntnisse",
    languages: "Sprachen",
    interests: "Interessen",
    relevant: "Relevante Kurse",
    contact: "Kontakt",
  },
  fr: {
    education: "Formation",
    work: "Expérience",
    projects: "Projets",
    volunteer: "Bénévolat",
    awards: "Distinctions",
    skills: "Compétences",
    languages: "Langues",
    interests: "Centres d’intérêt",
    relevant: "Cours pertinents",
    contact: "Contact",
  },
};
const app = document.querySelector("#app");
let current = new URLSearchParams(location.search).get("lang") || "en";
if (!files[current]) current = "en";
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );
const link = (url, text) =>
  url
    ? `<a href="${escape(url)}" target="_blank" rel="noreferrer">${escape(text)}</a>`
    : escape(text);
const date = (item) =>
  [item.startDate, item.endDate].filter(Boolean).join(" — ") || item.date || "";
const tags = (values) =>
  values?.length
    ? `<div class="tags">${values.map((x) => `<span>${escape(x)}</span>`).join("")}</div>`
    : "";
const bullets = (values) =>
  values?.length
    ? `<ul>${values.map((x) => `<li>${escape(x)}</li>`).join("")}</ul>`
    : "";
function entry(item, type, t) {
  const title =
    type === "education"
      ? `${item.studyType || ""} ${item.area || ""}`.trim()
      : type === "work"
        ? item.position
        : type === "volunteer"
          ? item.position
          : item.title || item.name;
  const place =
    type === "education"
      ? link(item.url, item.institution)
      : type === "work"
        ? item.name
        : type === "volunteer"
          ? item.organization
          : item.awarder;
  const course = item.special_courses?.length
    ? [
        ...item.special_courses,
        ...(item.courses || []).map((x) => `${t.relevant}: ${x}`),
      ]
    : item.courses;
  return `<article class="entry"><time class="date">${escape(date(item))}</time><h3>${link(item.url, title)}</h3>${place ? `<h4>${place}</h4>` : ""}${item.summary || item.description ? `<p>${escape(item.summary || item.description)}</p>` : ""}${bullets(item.highlights || course)}${tags(item.technologies || item.keywords)}</article>`;
}
function section(items, kind, title, t) {
  return items?.length
    ? `<section class="section"><h2 class="section-title">${escape(title)}</h2>${items.map((x) => entry(x, kind, t)).join("")}</section>`
    : "";
}
function render(data) {
  const b = data.basics || {},
    t = labels[current],
    location = b.location || {},
    initials = (b.name || "CV")
      .split(/\s+/)
      .map((x) => x[0])
      .slice(0, 2)
      .join("");
  const contact = [
    [t.contact, ""],
    ["Email", b.email && link(`mailto:${b.email}`, b.email)],
    ["Phone", b.phone && link(`tel:${b.phone.replace(/\s/g, "")}`, b.phone)],
    [
      "Location",
      [location.city, location.region, location.countryCode]
        .filter(Boolean)
        .join(", "),
    ],
  ];
  const profiles =
    b.profiles?.map((p) => [
      "Profile",
      link(p.url, `${p.network} / ${p.username}`),
    ]) || [];
  const skills =
    data.skills
      ?.map(
        (s) =>
          `<div class="skill-group"><h3>${escape(s.name)}</h3><div class="chips">${(s.keywords || []).map((k) => `<span class="chip">${escape(k)}</span>`).join("")}</div></div>`,
      )
      .join("") || "";
  const languages =
    data.languages
      ?.map(
        (x) =>
          `<div class="lang-row"><span>${escape(x.language)}</span><span>${escape(x.fluency)}</span></div>`,
      )
      .join("") || "";
  const interests =
    data.interests
      ?.map(
        (x) =>
          `<li><strong>${escape(x.name)}</strong>${x.keywords?.length ? ` — ${escape(x.keywords.join(", "))}` : ""}</li>`,
      )
      .join("") || "";
  app.innerHTML = `<article class="cv"><aside class="sidebar"><div class="initials" aria-hidden="true">${escape(initials)}</div><ul class="contact">${[
    ...contact,
    ...profiles,
  ]
    .filter((x) => x[1])
    .map(([k, v]) => `<li><span class="label">${escape(k)}</span>${v}</li>`)
    .join(
      "",
    )}</ul>${skills ? `<h2>${t.skills}</h2>${skills}` : ""}${languages ? `<h2>${t.languages}</h2>${languages}` : ""}${interests ? `<h2>${t.interests}</h2><ul class="clean-list">${interests}</ul>` : ""}</aside><div class="content"><h1 class="name">${escape(b.name)}</h1><p class="role">${escape(b.label)}</p>${b.summary ? `<p class="summary">${escape(b.summary)}</p>` : ""}${section(data.work, "work", t.work, t)}${section(data.education, "education", t.education, t)}${section(data.projects, "projects", t.projects, t)}${section(data.volunteer, "volunteer", t.volunteer, t)}${section(data.awards, "awards", t.awards, t)}</div></article>`;
}
async function load(language) {
  current = language;
  document.documentElement.lang = language;
  document
    .querySelectorAll("[data-cv]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.cv === language),
      ),
    );
  history.replaceState(null, "", `?lang=${language}`);
  try {
    const response = await fetch(`data/${files[language]}`);
    if (!response.ok) throw new Error(response.status);
    render(await response.json());
  } catch {
    app.innerHTML =
      '<p class="error">The CV data could not be loaded. Please try again later.</p>';
  }
}
document
  .querySelectorAll("[data-cv]")
  .forEach((button) =>
    button.addEventListener("click", () => load(button.dataset.cv)),
  );
load(current);
