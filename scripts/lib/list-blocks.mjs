// Prints the blocks and the ones without a renderer as JSON (run with tsx).
// Loading the real lists also proves every block and renderer file compiles.
import "./allow-server-only.cjs";
import { allBlocks } from "../../src/content/blocks/index.ts";
import { blockComponents } from "../../src/components/site/blocks/index.ts";

const describe = (def) => ({ type: def.type, label: typeof def.label === "string" ? def.label : def.label.en });
console.log(JSON.stringify({ blocks: allBlocks.map(describe), withoutRenderer: allBlocks.filter((def) => !(def.type in blockComponents)).map((def) => def.type) }));
