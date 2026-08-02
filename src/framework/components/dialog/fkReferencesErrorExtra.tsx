"use client";

import Link from "next/link";
import { registerErrorExtra } from "./ErrorDialog";

interface FkReference {
  id: string;
  label: string;
  href?: string;
}

registerErrorExtra("fk-references", (meta) => {
  const references = (meta.references as FkReference[] | undefined) ?? [];
  const moreCount = (meta.moreCount as number | undefined) ?? 0;
  if (references.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <p className="text-xs font-medium text-muted-foreground">
        Referenced by existing records
      </p>
      <ul className="flex flex-col gap-1">
        {references.map((ref) => (
          <li key={ref.id}>
            {ref.href ? (
              <Link
                target="_blank"
                href={ref.href}
                className="underline underline-offset-2"
              >
                {ref.label} #{ref.id}
              </Link>
            ) : (
              <span>
                {ref.label} #{ref.id}
              </span>
            )}
          </li>
        ))}
        {moreCount > 0 && (
          <li className="text-muted-foreground">…and {moreCount} more</li>
        )}
      </ul>
    </div>
  );
});
