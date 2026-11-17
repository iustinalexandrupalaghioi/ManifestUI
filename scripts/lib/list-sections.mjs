// Prints the registered page sections and site parts as JSON (run with tsx).
// Loading the real registry also proves every section file compiles and imports.
import "./allow-server-only.cjs";
import { sections } from "../../src/components/extensions/sections/index.ts";
import { siteChrome } from "../../src/components/extensions/site/index.ts";

const describe = (def) => ({ type: def.type, label: typeof def.label === "string" ? def.label : def.label.en, data: !!def.data });
console.log(JSON.stringify({ sections: sections.map(describe), chrome: siteChrome.map(describe) }));
