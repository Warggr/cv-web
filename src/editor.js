import { renderTheme, loadDefaultThemes } from "./themes/index.js";

export const channel = new BroadcastChannel("cv_json_content");

const files = {
  example: new URL("/data/mock-resume-john-doe.json?url", import.meta.url).href,
};

const editor = document.querySelector("#json-editor");
const editorStatus = document.querySelector("#editor-status");
const btnCompile = document.querySelector("#btn-compile");
const btnLoadUrl = document.querySelector("#btn-load-url");
const fileUpload = document.querySelector("#file-upload");
const imageUpload = document.querySelector("#image-upload");
const themeSelect = document.querySelector("#theme-select");

const urlParams = new URLSearchParams(window.location.search);
let currentLang = urlParams.get("cv") || "example";
if (!files[currentLang]) currentLang = "example";

loadDefaultThemes().then((themes) => {
  const children = Object.keys(themes).map((theme) => {
    let child = document.createElement("option");
    child.value = theme;
    child.textContent = theme;
    return child;
  });
  let add = document.createElement("option");
  add.value = "+";
  add.textContent = "Add themes...";
  children.push(add);
  themeSelect.replaceChildren(...children);
});

let currentTheme = urlParams.get("theme") || "Desert Modern";
themeSelect.value = currentTheme;

function setStatus(text, type = "normal") {
  editorStatus.textContent = text;
  editorStatus.className = "editor-status " + (type || "");
}

function updateUrl(preset, theme) {
  const url = new URL(window.location);
  if (preset) {
    url.searchParams.set("preset", preset);
  } else {
    url.searchParams.delete("preset");
  }
  if (theme) {
    url.searchParams.set("theme", theme);
  } else {
    url.searchParams.delete("theme");
  }
  window.history.replaceState({}, "", url);
}

function updateButtons(preset) {
  document.querySelectorAll("[data-cv]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.cv === preset));
  });
}

async function renderFromData(data, preset) {
  try {
    setStatus("Compiling theme…");
    const activeThemeName = themeSelect ? themeSelect.value : currentTheme;
    const html = await renderTheme(activeThemeName, data, {
      preset: preset || currentLang,
    });
    setStatus("Compiled successfully", "success");
    return html;
  } catch (err) {
    console.error("Render error:", err);
    setStatus("Render error", "error");
    return `<div class="error-banner"><strong>Render Error:</strong> ${err.message}</div>`;
  }
}

async function compileEditorContent() {
  const text = editor.value.trim();
  if (!text) {
    setStatus("Empty document", "error");
    return;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    setStatus("Invalid JSON", "error");
    app.innerHTML = `<div class="error-banner"><strong>JSON Syntax Error:</strong> ${err.message}</div>`;
    return;
  }
  if (
    localStorage.getItem("profile-image") !== undefined &&
    data.basics.image == ""
  ) {
    data.basics.image = localStorage.getItem("profile-image");
  }

  const preset = data?.meta?.preset || currentLang;
  const html = await renderFromData(data, preset);
  channel.postMessage(html);
}

async function loadPreset(preset) {
  currentLang = preset;
  document.documentElement.preset = preset;
  updateButtons(preset);
  updateUrl(preset, currentTheme);

  try {
    setStatus("Loading preset…");
    const filename = files[preset];
    const res = await fetch(filename);
    if (!res.ok) {
      throw new Error(`Failed to load ${filename}: ${res.statusText}`);
    }
    const data = await res.json();
    editor.value = JSON.stringify(data, null, 2);
    await renderFromData(data, preset);
  } catch (err) {
    console.error("Preset load error:", err);
    setStatus("Failed to load preset", "error");
    app.innerHTML = `<div class="error-banner">Failed to load preset: ${err.message}</div>`;
  }
}

// Preset button handlers
document.querySelectorAll("[data-cv]").forEach((button) => {
  button.addEventListener("click", () => {
    const preset = button.dataset.cv;
    if (preset) {
      loadPreset(preset);
    }
  });
});

// Theme switcher handler
if (themeSelect) {
  themeSelect.addEventListener("change", async () => {
    currentTheme = themeSelect.value;
    if (currentTheme == "+") {
      window.location.replace(
        new URL("src/theme_select.html", window.location.href),
      );
    }
    updateUrl(currentLang, currentTheme);
    await compileEditorContent();
  });
}

// Compile button
btnCompile.addEventListener("click", compileEditorContent);

// Keyboard shortcut: Ctrl+Enter / Cmd+Enter to recompile
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    compileEditorContent();
  }
});

// Indent support in textarea (Tab inserts 2 spaces)
editor.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value =
      editor.value.substring(0, start) + "  " + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
  }
});

// File upload handler
fileUpload.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const content = event.target.result;
      const parsed = JSON.parse(content);
      editor.value = JSON.stringify(parsed, null, 2);
      await compileEditorContent();
      updateButtons(null);
      setStatus(`Loaded "${file.name}"`, "success");
    } catch (err) {
      setStatus("Upload error: invalid JSON", "error");
      alert("Selected file is not valid JSON: " + err.message);
    }
  };
  reader.readAsText(file);
});

// Load from URL handler
btnLoadUrl.addEventListener("click", async () => {
  const url = prompt("Enter the public URL of a raw JSON resume:");
  if (!url) return;

  try {
    setStatus("Fetching URL…");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    editor.value = JSON.stringify(data, null, 2);
    await compileEditorContent();
    updateButtons(null);
    setStatus("Loaded from URL", "success");
  } catch (err) {
    console.error("URL fetch error:", err);
    setStatus("URL fetch failed", "error");
    alert(
      "Could not load JSON from URL: " +
        err.message +
        "\n(Note: CORS may block requests to some domains)",
    );
  }
});

imageUpload.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    localStorage.setItem("profile-image", reader.result);
    compileEditorContent();
  });
  reader.readAsDataURL(file);
});

// Initial load
loadPreset(currentLang);
