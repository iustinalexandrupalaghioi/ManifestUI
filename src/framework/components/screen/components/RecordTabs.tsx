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
import type { ComponentType } from "react";
import type { FieldValues } from "react-hook-form";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";

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
}: RecordTabsProps<TItem, TFormValues>) {
  const pathname = usePathname();
  const locale = useLocale();
  const itemId = getItemId(item as Record<string, unknown>, idField);
  const formKey = `${itemId}-${JSON.stringify(item)}`;

  return (
    <CustomTabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="mt-2 w-full gap-0"
    >
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
      {tabs.map((tab) => {
        if (tab.type === "fields") {
          return (
            <CustomTabsContent
              key={tab.value}
              value={tab.value}
              className={cn("mt-0 py-6", contentClassName)}
            >
              <Form
                key={formKey}
                item={item}
                sections={tab.sections}
                readOnly={readOnly}
              />
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
                className="mt-0 py-0"
              />
            );
          }

          return (
            <CustomTabsContent
              key={tab.value}
              value={tab.value}
              className="mt-0 py-0"
            >
              <RelationList
                relation={relation}
                item={item}
                slotId={`${tab.value}-${itemId}`}
                height={tab.height ?? (formOpen ? 430 : undefined)}
              />
            </CustomTabsContent>
          );
        }

        // type === "list" (default): fully custom tab content, owned by the caller.
        return (
          <CustomTabsContent key={tab.value} value={tab.value} className="mt-0 py-0">
            {tab.render(item, {
              formOpen,
              basePath: pathname,
            })}
          </CustomTabsContent>
        );
      })}
    </CustomTabs>
  );
}
