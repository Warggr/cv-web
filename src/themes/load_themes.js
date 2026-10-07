import html2canvas from "html2canvas";
import { inflate } from "pako";
import untar from "js-untar";
const { registerFiles } = await import(/* @vite-ignore */ "/fs-polyfill.js");

const REGISTRY_URL = "https://registry.npmjs.org/-/v1/search";
const ESM_BASE = "https://esm.sh/";
const NPM_BASE = "https://registry.npmjs.org/";

const MAX_THEMES = 100;
const PAGE_SIZE = 20;

const themeGrid = document.getElementById("themes");

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

function createTile(theme) {
  const tile = document.createElement("div");
  tile.className = "theme-tile";

  const title = document.createElement("div");
  title.className = "theme-title";
  title.textContent = theme.package.name;

  const status = document.createElement("div");
  status.className = "theme-status";
  status.textContent = "Loading...";

  const preview = document.createElement("div");
  preview.className = "theme-preview";

  tile.append(title, status, preview);
  themeGrid.appendChild(tile);

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

async function getThemeUrl(theme) {
  const name = theme.package.name;
  const version = theme.package.version;

  // esm.sh will resolve the package and its dependencies.
  const url = `${ESM_BASE}${name}@${version}?external=node:fs,fs`;
  const npm_url = `${NPM_BASE}${name}/${version}`;
  const tarball_url = (await fetch(npm_url).then((res) => res.json())).dist
    .tarball;

  return { name, url, tarball_url, version };
}

async function registerFilesForModule(theme) {
  const files = await fetch(theme.tarball_url)
    .then((res) => res.arrayBuffer())
    .then(inflate)
    .then((arr) => arr.buffer)
    .then(untar);
  registerFiles(theme, files);
}

export async function loadTheme(theme) {
  console.debug(`Loading ${theme.name} from ${theme.url}`);
  await registerFilesForModule(theme);
  const module = await import(/* @vite-ignore */ theme.url);

  if (typeof module.render !== "function") {
    throw new Error("Theme does not export a render() function");
  }
  return module.render;
}

async function loadThemePreview(theme, resume) {
  const { status, preview } = createTile(theme);

  try {
    const theme_info = await getThemeUrl(theme);
    const render = await loadTheme(theme_info);
    const html = await render(resume);

    if (typeof html !== "string") {
      throw new Error(
        `render() returned ${typeof html}, expected an HTML string`,
      );
    }

    status.textContent = "Rendering preview...";

    const canvas = await renderPreview(html);

    const image = document.createElement("img");
    image.src = canvas.toDataURL("image/png");
    image.alt = `Preview of ${theme.package.name}`;

    preview.replaceChildren(image);
    status.textContent = "Ready";
    return theme_info;
  } catch (error) {
    setError(status, error);
    return null;
  }
}

async function* getAllThemes() {
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
      yield result;
    }

    if (results.objects.length === 0) {
      break;
    }

    offset += results.objects.length;

    // Don't hammer the registry.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Used by many themes
await getThemeUrl({
  package: { name: "resume-schema", version: "0.0.15" },
}).then(registerFilesForModule);

export async function main() {
  let resume;

  try {
    resume = await getResume();
  } catch (error) {
    themeGrid.textContent = error.message;
    return;
  }

  let count = 0;

  let promises = [];
  try {
    for await (const theme of getAllThemes()) {
      // Start loading immediately. Don't await it here, otherwise one
      // broken/slow theme would hold up all the subsequent tiles.
      promises.push(loadThemePreview(theme, resume));

      count++;

      if (count >= MAX_THEMES) {
        break;
      }
    }
    let themes = await Promise.all(promises);
    themes = themes.filter((theme) => theme !== null);
    localStorage.setItem("external-themes", JSON.stringify(themes));
  } catch (error) {
    console.error("Could not load theme list:", error);

    const errorElement = document.createElement("div");
    errorElement.textContent = `Could not load themes: ${error.message}`;
    themeGrid.appendChild(errorElement);
  }
}
