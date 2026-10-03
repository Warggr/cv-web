export default function importOptionalTheme() {
  return {
    name: "import-optional-themes",
    async resolveId(source) {
      if (source.startsWith("jsonresume-theme-")) {
        let result = await this.resolve(source, undefined, { skipSelf: true });
        if (result === null) {
          return "\0theme-not-bundled:" + source;
        }
        return result;
      }
    },
    load(id) {
      if (id.startsWith("\0theme-not-bundled:")) {
        return `export const NOT_BUNDLED = true; export function render() { throw new Error("Theme not bundled: ${id}") }`;
      }
      return null;
    },
  };
}
