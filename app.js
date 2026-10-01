import { render as renderWarggr } from "./src/themes/warggr.js";

const files = {
  en: "resume-main.json",
  de: "resume-main-DE.json",
  fr: "resume-main-FR.json",
};

const app = document.querySelector("#app");

const urlParams = new URLSearchParams(window.location.search);
let currentLang = urlParams.get("lang") || "en";
if (!files[currentLang]) currentLang = "en";

function updateUrl(lang) {
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

function updateButtons(lang) {
  document.querySelectorAll("[data-cv]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.cv === lang));
  });
}

async function renderResume(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  updateButtons(lang);
  updateUrl(lang);

  try {
    app.innerHTML = '<p class="loading">Loading CV…</p>';
    const filename = files[lang];
    const res = await fetch(`data/${filename}`);
    if (!res.ok) {
      throw new Error(`Failed to load data/${filename}: ${res.statusText}`);
    }
    const data = await res.json();

    // Render using Handlebars theme
    const html = renderWarggr(data, { lang });

    // Extract body content or display in container
    // Because template.handlebars outputs a full <!DOCTYPE html> document,
    // we can parse it and inject its head stylesheets + body content safely into #app
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove any previously injected theme styles
    document
      .querySelectorAll("style[data-theme-sheet]")
      .forEach((el) => el.remove());

    // Inject styles from the theme's head into document head
    doc.querySelectorAll("style").forEach((styleEl) => {
      const cloned = document.createElement("style");
      cloned.setAttribute(
        "data-theme-sheet",
        styleEl.getAttribute("data-sheet") || "theme",
      );
      cloned.textContent = styleEl.textContent;
      document.head.appendChild(cloned);
    });

    // Make sure font-awesome is present
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fa = document.createElement("link");
      fa.rel = "stylesheet";
      fa.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";
      document.head.appendChild(fa);
    }

    // Replace app content with body of rendered theme
    app.innerHTML = doc.body.innerHTML;
  } catch (err) {
    console.error("Error rendering CV:", err);
    app.innerHTML = `<p class="error">The CV could not be loaded: ${err.message}. Please try again.</p>`;
  }
}

// Attach event listeners to language switcher buttons
document.querySelectorAll("[data-cv]").forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.cv;
    if (lang && lang !== currentLang) {
      renderResume(lang);
    }
  });
});

// Initial render
renderResume(currentLang);
