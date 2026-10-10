import html2canvas from "html2canvas";
import {
  loadTheme,
  getThemeUrl,
  getBundledThemes,
  getStarredThemeDescrs,
} from "./index.js";

const REGISTRY_URL = "https://registry.npmjs.org/-/v1/search";
const MAX_THEMES = 500;
const PAGE_SIZE = 20;

// CORS-restricted, for whatever reason
/* function getAllThemes() {
	fetch("https://registry.jsonresume.org/api/themes").then(res => res.json());
} */
const RESUME_URL = new URL(
  "/data/mock-resume-john-doe.json?url",
  import.meta.url,
).href;

async function getResume() {
  return fetch(RESUME_URL).then((res) => res.json());
}

const tile_template = document.getElementById("theme-tile-template");

function createTile(theme) {
  const tile = document.importNode(tile_template.content, true);

  const title = tile.querySelector(".theme-info > h3");
  title.textContent = theme.name;

  const status = tile.querySelector("span.status");
  status.textContent = "Loading...";

  const preview = tile.querySelector("div.theme-preview > img");
  preview.hidden = true;

  return {
    tile,
    status,
    preview,
  };
}

function setError(status, error) {
  console.error(error);

  status.textContent =
    error instanceof Error
      ? `Error: ${error.message}`
      : `Error: ${String(error)}`;
}

/**
 * Render the theme into an iframe and turn it into a canvas.
 *
 * Using an iframe rather than directly putting the HTML into the page
 * prevents theme CSS from affecting the theme browser itself.
 */
async function renderPreview(html) {
  const iframe = document.createElement("iframe");

  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  iframe.style.height = "1100px";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  try {
    const iframeDocument = iframe.contentDocument;

    if (!iframeDocument) {
      throw new Error("Could not access preview iframe");
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();

    // Wait for the browser to perform layout.
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Wait for fonts.
    if (iframeDocument.fonts) {
      await iframeDocument.fonts.ready;
    }

    // Wait for images used by the theme.
    await Promise.all(
      [...iframeDocument.images]
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
        ),
    );

    const body = iframeDocument.body;

    if (!body) {
      throw new Error("Theme did not produce a body");
    }

    const canvas = await html2canvas(body, {
      backgroundColor: null,
      useCORS: true,
      scale: 1,
      logging: false,
    });

    return canvas;
  } finally {
    iframe.remove();
  }
}

const loaded_section = document.getElementById("themes-loaded");
const loaded_counter = loaded_section.querySelector(".counter");
const loaded = loaded_section.querySelector("ul");
const starred_section = document.getElementById("themes-starred");
const starred_counter = starred_section.querySelector(".counter");
const starred = starred_section.querySelector("ul");
const loading_section = document.getElementById("themes-loading");

async function loadThemePreview(theme, resume, is_starred) {
  const failed_section = document.getElementById("themes-failed");
  const loading_counter = loading_section.querySelector(".counter");

  const loading = loading_section.querySelector("ul");

  let { tile, status, preview } = createTile(theme);
  loading.appendChild(tile);
  // tile is a DocumentFragment, and only becomes a Node through appendChild.
  tile = loading.lastElementChild;
  loading_counter.textContent = loading.children.length;

  try {
    const render = await loadTheme(theme);
    const html = await render(resume);

    if (typeof html !== "string") {
      throw new Error(
        `render() returned ${typeof html}, expected an HTML string`,
      );
    }

    status.textContent = "Rendering preview...";

    const canvas = await renderPreview(html);
    preview.src = canvas.toDataURL("image/png");
    preview.alt = `Preview of ${theme.name}`;

    status.textContent = "Ready";
    tile
      .querySelector(".theme-checkbox")
      .setAttribute("data-theme-info", JSON.stringify(theme));
  } catch (error) {
    setError(status, error);
    failed_section.appendChild(tile);
    loading_counter.textContent = loading.children.length;
    return null;
  }
  preview.hidden = false;
  status.hidden = true;
  if (is_starred) {
    tile.querySelector(".theme-checkbox").checked = true;
    starred.appendChild(tile);
    starred_counter.textContent = loaded.children.length;
  } else {
    loaded.appendChild(tile);
    loaded_counter.textContent = loaded.children.length;
  }

  loading_counter.textContent = loading.children.length;
  return theme;
}

async function* getAllThemes() {
  let loaded_themes = new Set();
  for (const theme of getStarredThemeDescrs()) {
    if (loaded_themes.has(theme.name)) continue;
    loaded_themes.add(theme.name);
    yield [theme, true];
  }
  for (const theme of getBundledThemes()) {
    if (loaded_themes.has(theme.name)) continue;
    loaded_themes.add(theme.name);
    yield [theme, false];
  }

  let offset = 0;
  while (true) {
    const params = new URLSearchParams({
      text: "jsonresume-theme-",
      size: String(PAGE_SIZE),
      from: String(offset),
    });

    const response = await fetch(`${REGISTRY_URL}?${params}`);

    if (!response.ok) {
      throw new Error(
        `npm registry returned ${response.status} ${response.statusText}`,
      );
    }

    const results = await response.json();

    for (const result of results.objects) {
      let theme = await getThemeUrl(result);
      if (loaded_themes.has(theme.name)) continue;
      loaded_themes.add(theme.name);
      yield [theme, false];
    }

    if (results.objects.length === 0) {
      break;
    }

    offset += results.objects.length;

    // Don't hammer the registry.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export async function main() {
  let resume;

  try {
    resume = await getResume();
  } catch (error) {
    loading_section.textContent = error.message;
    return;
  }

  let count = 0;

  let promises = [];
  try {
    for await (const [theme, is_starred] of getAllThemes()) {
      // Start loading immediately. Don't await it here, otherwise one
      // broken/slow theme would hold up all the subsequent tiles.
      promises.push(loadThemePreview(theme, resume, is_starred));

      count++;

      if (count >= MAX_THEMES) {
        break;
      }
    }
    let themes = await Promise.all(promises);
    themes = themes.filter((theme) => theme !== null);
  } catch (error) {
    console.error("Could not load theme list:", error);

    const errorElement = document.createElement("div");
    errorElement.textContent = `Could not load themes: ${error.message}`;
    loading_section.appendChild(errorElement);
  }
}

const star_callback = (event) => {
  const tile = event.target.parentNode.parentNode.parentNode;
  let themes = JSON.parse(localStorage.getItem("themes") || "[]");
  if (event.target.checked) {
    starred.appendChild(tile);
    themes.push(JSON.parse(event.target.getAttribute("data-theme-info")));
  } else {
    loaded.appendChild(tile);
    themes = themes.filter(
      (theme) =>
        JSON.stringify(theme) != event.target.getAttribute("data-theme-info"),
    );
  }
  localStorage.setItem("themes", JSON.stringify(themes));
  loaded_counter.textContent = loaded.children.length;
  starred_counter.textContent = starred.children.length;
};
loaded.addEventListener("change", star_callback);
starred.addEventListener("change", star_callback);
