"use client";

import {
  CustomTabs,
  CustomTabsContent,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/framework/components/ui/CustomTabs";
import { cn } from "@/framework/lib/utils";
import { RelationList } from "@/framework/components/relations/RelationList";
import { TabTriggerLabel } from "./TabTriggerLabel";
import { getItemId } from "@/framework/core/resource-id";
import type { FormProps } from "@/framework/types/resource-components-types";
import type { TabConfig } from "@/framework/types/tab-config-type";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { renderDetailExtension } from "@/framework/extensions/renderers";

interface RecordTabsProps<TItem, TFormValues extends FieldValues> {
  tabs: TabConfig<TItem, TFormValues>[];
  relations?: RelationConfig<TItem, any, any>[];
  activeTab: string;
  setActiveTab: (value: string) => void;
  item: TItem;
  idField?: string;
  Form: ComponentType<FormProps<TItem, TFormValues>>;
  formOpen: boolean;
  contentClassName?: string;
  readOnly?: boolean;
  /**
   * Shown above the tab list, and kept in view with it while the active tab's
   * content scrolls (the record's title bar, when every field is in a tab).
   */
  header?: ReactNode;
  /** Beside the tab content, the height of its scroll area (the live preview). With `header` only. */
  aside?: ReactNode;
}

export function RecordTabs<TItem, TFormValues extends FieldValues>({
  tabs,
  relations = [],
  activeTab,
  setActiveTab,
  item,
  idField = "id",
  Form,
  formOpen,
  contentClassName,
  readOnly,
  header,
  aside,
}: RecordTabsProps<TItem, TFormValues>) {
  const pathname = usePathname();
  const locale = useLocale();
  const itemId = getItemId(item as Record<string, unknown>, idField);
  const formKey = `${itemId}-${JSON.stringify(item)}`;
  // With a header (every field in a tab): the header and tab list stay put and only the active
  // tab's content scrolls, in its own area filling the rest of the screen. A tab's own header
  // row sticks to the top of that area (STICKY_IN_RECORD reads --record-sticky-top: 0).
  const fixedHeader = header !== undefined;
  // No padding on the scroll area itself (a sticky header would stick below it, with content
  // showing through); the room under the tab line is on the content and scrolls away.
  const scrollArea = fixedHeader ? "min-h-0 flex-1 overflow-y-auto py-0" : undefined;
  const padded = (node: ReactNode) => (fixedHeader ? <div className="pt-4 pb-6">{node}</div> : node);

  return (
    <div
      style={fixedHeader ? ({ "--record-sticky-top": "0px" } as CSSProperties) : undefined}
      className={fixedHeader ? "flex min-h-0 flex-1 flex-col" : "contents"}
    >
    <CustomTabs
      value={activeTab}
      onValueChange={setActiveTab}
      className={cn("w-full gap-0", fixedHeader && "min-h-0 flex-1")}
    >
      <div className={cn(fixedHeader && "shrink-0 bg-background")}>
      {header}
      <div className="flex items-center gap-1 overflow-x-auto">
        <CustomTabsList>
          {tabs.map((tab, index) => {
            const label = resolveLabel(tab.label, locale);
            return (
              <div key={tab.value} className="flex items-center">
                <CustomTabsTrigger value={tab.value} title={label}>
                  <TabTriggerLabel
                    icon={tab.icon}
                    label={label}
                    index={index}
                  />
                </CustomTabsTrigger>
              </div>
            );
          })}
        </CustomTabsList>
      </div>
      </div>
      <div className={cn(fixedHeader && "flex min-h-0 flex-1 gap-3")}>
      <div className={cn(fixedHeader && "flex min-h-0 min-w-0 flex-1 flex-col")}>
      {tabs.map((tab) => {
        if (tab.type === "fields") {
          return (
            <CustomTabsContent
              key={tab.value}
              value={tab.value}
              className={cn("mt-0 py-6", contentClassName, scrollArea)}
            >
              {padded(
                <Form
                  key={formKey}
                  item={item}
                  sections={tab.sections}
                  pane={tab.formTab}
                  readOnly={readOnly}
                />,
              )}
            </CustomTabsContent>
          );
        }

        if (tab.type === "relation") {
          const relation = relations.find((r) => r.key === tab.relationKey);
          if (!relation) {
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                `[RecordTabs] tab "${tab.value}" references relationKey "${tab.relationKey}", which is not in this resource's \`relations\`.`,
              );
            }
            return (
              <CustomTabsContent
                key={tab.value}
                value={tab.value}
                className={cn("mt-0 py-0", scrollArea)}
              />
            );
          }

          return (
            <CustomTabsContent
              key={tab.value}
              value={tab.value}
              className={cn("mt-0 py-0", scrollArea)}
            >
              {padded(
                <RelationList
                  relation={relation}
                  item={item}
                  slotId={`${tab.value}-${itemId}`}
                  height={tab.height ?? (formOpen ? 430 : undefined)}
                />,
              )}
            </CustomTabsContent>
          );
        }

        if (tab.type === "extension") {
          return (
            <CustomTabsContent key={tab.value} value={tab.value} className={cn("mt-0 py-0", scrollArea)}>
              {padded(renderDetailExtension(tab.component, item, { formOpen, basePath: pathname }))}
            </CustomTabsContent>
          );
        }

        return (
          <CustomTabsContent
            key={tab.value}
            value={tab.value}
            className={cn("mt-0 py-0", scrollArea)}
          >
            {tab.render(item, {
              formOpen,
              basePath: pathname,
            })}
          </CustomTabsContent>
        );
      })}
      </div>
      {fixedHeader && aside}
      </div>
    </CustomTabs>
    </div>
  );
}

