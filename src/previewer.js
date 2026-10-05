export const channel = new BroadcastChannel("cv_json_content");

const shadow_doc = document.querySelector("#app").shadowRoot;

function adaptStylesForShadowDom(css) {
  return css
    .replace(/:root\b/g, ":host")
    .replace(/\bhtml\b/g, ":host")
    .replace(/\bbody\b/g, ":host");
}

async function getStyleSheetFromStyleNode(el) {
  const sheet = new CSSStyleSheet();
  const css = adaptStylesForShadowDom(el.textContent);
  await sheet.replace(css);
  return sheet;
}

async function getStyleSheetFromLink(el) {
  const sheet = new CSSStyleSheet();
  const response = await fetch(el.href);
  const css = await response.text();
  const css_adapted = adaptStylesForShadowDom(css);
  await sheet.replace(css);
  return sheet;
}

async function showCompiledEditorContent(event) {
  let html = event.data;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  console.warn(doc);

  console.assert(doc.children.length == 1);
  const htmlElement = doc.documentElement;
  console.assert(htmlElement.children.length == 2);
  const body = doc.body;
  const head = doc.head;
  let style_promises = [];
  [...head.children].forEach((el) => {
    if (el.nodeName == "STYLE") {
      style_promises.push(getStyleSheetFromStyleNode(el));
    } else if (el.nodeName == "LINK" && el.rel == "stylesheet") {
      style_promises.push(getStyleSheetFromLink(el));
    } else {
      console.warn("Ignoring header", el.outerHTML);
    }
  });

  shadow_doc.adoptedStyleSheets = await Promise.all(style_promises);
  shadow_doc.innerHTML = body.innerHTML;
}
channel.onmessage = showCompiledEditorContent;

async function unloadPreviewer() {
  channel.onmessage = () => {};
}
