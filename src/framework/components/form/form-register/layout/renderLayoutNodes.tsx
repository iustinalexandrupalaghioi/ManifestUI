import type { ButtonNode, LayoutNode } from "../../types/types";
import type { ParentInfo } from "../../lib/placement";
import { LayoutNodeRenderer } from "./LayoutNodeRenderer";

// Buttons go through the frame too, so `hidden`, `order`, `grow`… work on them.
export function renderButtons(buttons: ButtonNode<any>[]) {
  return buttons.map((b) => (
    <LayoutNodeRenderer
      key={b.key}
      node={b}
      parent={{ kind: "flex", bp: "base", direction: "row" }}
    />
  ));
}

export function renderChildren(children: LayoutNode<any>[], parent: ParentInfo) {
  // The same field may legitimately appear twice among siblings, so
  // disambiguate repeated keys instead of colliding.
  const seen = new Map<string, number>();
  return children.map((child, i) => {
    const base =
      child.key ?? ("name" in child ? `${child.type}:${child.name}` : `${child.type}:${i}`);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return (
      <LayoutNodeRenderer
        key={count ? `${base}#${count}` : base}
        node={child}
        parent={parent}
      />
    );
  });
}
