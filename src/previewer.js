export const channel = new BroadcastChannel("cv_json_content");

const shadow_doc = document.querySelector("#app");
shadow_doc.addEventListener("load", () => {
  const doc = shadow_doc.contentDocument;
  const doc_height = Math.max(
    doc.documentElement.scrollHeight,
    doc.body.scrollHeight,
  );
  const height_style = `${doc_height}px`;
  shadow_doc.style.height = height_style;
});

async function showCompiledEditorContent(event) {
  let html = event.data;
  shadow_doc.srcdoc = html;
}
channel.onmessage = showCompiledEditorContent;

async function unloadPreviewer() {
  channel.onmessage = () => {};
}
