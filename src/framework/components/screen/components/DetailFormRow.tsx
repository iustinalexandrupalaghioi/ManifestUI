import type { ReactNode } from "react";

interface DetailFormRowProps {
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}

export function DetailFormRow({ left, right, children }: DetailFormRowProps) {
  if (!left && !right) return <>{children}</>;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {left}
      <div className="min-w-0 flex-1">{children}</div>
      {right}
    </div>
  );
}
