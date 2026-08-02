import type { ReactNode } from "react";

/**
 * The content inside a single TabsTrigger: icon, optional debug numbering,
 * label. Was previously copy-pasted identically into RecordTabs and
 * AddTabs — pulled out so the numbering behavior only needs to change in
 * one place.
 */
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
