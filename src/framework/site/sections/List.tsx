/**
 * Renders a list field: each item in its own scope, so primitives inside use
 * paths relative to the item (<Text path="q" />) and <RemoveItem /> removes it.
 *
 * Not a client component: it takes a render function, which can't be passed
 * from a Server Component to a client one. That's also why it takes `items`
 * (from the section's `content`) instead of reading them from the scope.
 */
import type { ReactNode } from "react";
import { ItemScope } from "./primitives";

export function List<T>({
  path,
  items,
  children,
}: {
  /** Path of the list, relative to the current scope. */
  path: string;
  items: readonly T[];
  children: (item: T, index: number) => ReactNode;
}) {
  return (
    <>
      {items.map((item, index) => (
        <ItemScope key={index} path={path} index={index}>
          {children(item, index)}
        </ItemScope>
      ))}
    </>
  );
}
