import type { AnyExtension } from "./registry";

export interface PropControl {
  key: string;
  kind: "string" | "number" | "boolean" | "enum" | "unsupported";
  options?: string[];
  optional: boolean;
  defaultValue?: unknown;
  description?: string;
}

interface SchemaLike {
  def: { type: string; innerType?: SchemaLike; defaultValue?: unknown; shape?: Record<string, SchemaLike> };
  description?: string;
  options?: unknown[];
  shape?: Record<string, SchemaLike>;
}

const WRAPPERS = new Set(["optional", "default", "nullable", "readonly", "prefault"]);

/** Flattens a zod object schema into editor controls (e.g. for visual editors). */
export function describeProps(def: Pick<AnyExtension, "props">): PropControl[] {
  const shape = (def.props as SchemaLike | undefined)?.shape;
  if (!shape) return [];

  return Object.entries(shape).map(([key, schema]) => {
    let current = schema;
    let optional = false;
    let defaultValue: unknown;
    let description = current.description;
    while (WRAPPERS.has(current.def.type) && current.def.innerType) {
      if (current.def.type !== "readonly") optional = true;
      if (current.def.type === "default" || current.def.type === "prefault")
        defaultValue = current.def.defaultValue;
      current = current.def.innerType;
      description ??= current.description;
    }
    const type = current.def.type;
    const kind: PropControl["kind"] =
      type === "string" || type === "number" || type === "boolean" || type === "enum" ? type : "unsupported";
    return {
      key,
      kind,
      options: kind === "enum" ? (current.options ?? []).map(String) : undefined,
      optional,
      defaultValue,
      description,
    };
  });
}
