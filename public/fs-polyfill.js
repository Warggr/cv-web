const virtual_filesystem = (globalThis.__jsonresume_virtual_filesystem ??=
  new Map());

export function readFileSync(filename) {
  const filePath = filename.split("/");
  console.assert(filePath[0] == "", filePath);
  console.assert(filePath[3] == "es2022", filePath);
  filePath.splice(2, 2);
  filePath.splice(0, 1);
  const file = virtual_filesystem.get(filePath.join("/"));
  console.assert(
    virtual_filesystem.has(filePath.join("/")),
    filePath.join("/"),
  );
  return file;
}

export function readdirSync(dirname) {
  if (!dirname.endsWith("/")) {
    dirname += "/";
  }

  const entries = new Set();

  for (const filename of virtual_filesystem.keys()) {
    if (!filename.startsWith(dirname)) {
      continue;
    }

    const remainder = filename.slice(dirname.length);
    const slash = remainder.indexOf("/");

    if (slash === -1) {
      // Direct file.
      entries.add(remainder);
    } else if (slash > 0) {
      // Direct subdirectory.
      entries.add(remainder.slice(0, slash));
    }
  }

  return [...entries];
}
export function registerFiles(theme_info, files) {
  for (let file of files) {
    console.assert(file.name.startsWith("package/"));
    const virtual_filename = file.name.replace(
      "package",
      `${theme_info.name}@${theme_info.version}`,
    );
    try {
      virtual_filesystem.set(virtual_filename, file.readAsString());
    } catch (err) {
      // For some reason, some `.travis.yml` make the js-untar library fail
      console.warn("Couldn't register file:", virtual_filename);
    }
  }
}
