import type {
  BlockComponentDef,
  DetailComponentDef,
  FieldComponentDef,
  OverviewComponentDef,
  PropsInput,
} from "./registry";

type WithoutKind<D> = Omit<D, "kind" | "with">;

const referable = <TType extends string, S>(type: TType) => ({
  with: (props?: PropsInput<S>) => ({ type, props }),
});

/** Small component bound to one form value; used like a built-in field type. */
export function defineFieldComponent<const TType extends string, S = undefined, TValue = any>(
  def: WithoutKind<FieldComponentDef<TType, S, TValue>>,
): FieldComponentDef<TType, S, TValue> {
  return { ...def, kind: "field" };
}

/** Larger form section with access to the whole form and record. */
export function defineBlockComponent<const TType extends string, S = undefined>(
  def: WithoutKind<BlockComponentDef<TType, S>>,
): BlockComponentDef<TType, S> {
  return { ...def, kind: "block", ...referable<TType, S>(def.type) };
}

/** Detail page/dialog region: usable in `detail.slots` and as a detail tab. */
export function defineDetailComponent<const TType extends string, S = undefined, TItem = any>(
  def: WithoutKind<DetailComponentDef<TType, S, TItem>>,
): DetailComponentDef<TType, S, TItem> {
  return { ...def, kind: "detail", ...referable<TType, S>(def.type) };
}

/** Overview region: usable in `dataView.overview.slots`. */
export function defineOverviewComponent<const TType extends string, S = undefined, TItem = any>(
  def: WithoutKind<OverviewComponentDef<TType, S, TItem>>,
): OverviewComponentDef<TType, S, TItem> {
  return { ...def, kind: "overview", ...referable<TType, S>(def.type) };
}
