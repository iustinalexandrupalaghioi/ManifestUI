import type { ReactNode } from "react";

export function TabTriggerLabel({
  icon,
  label,
  index,
}: {
  icon?: ReactNode;
  label: string;
  index: number;
}) {
  return (
    <>
      {icon}
      {process.env.NEXT_PUBLIC_ENABLE_NUMBERED_TABS === "true" &&
        `${index + 1}.`}{" "}
      {label}
    </>
  );
}
