import { CustomTabs, CustomTabsContent, CustomTabsList, CustomTabsTrigger } from "@/framework/components/ui/CustomTabs";
import { TabTriggerLabel } from "./TabTriggerLabel";
import type {
  FieldTabConfig,
  TabConfig,
} from "@/framework/types/tab-config-type";
import type { ComponentType } from "react";
import type { FieldValues } from "react-hook-form";
import type { FormProps } from "@/framework/types/resource-components-types";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";

interface AddTabsProps<TItem, TFormValues extends FieldValues> {
  addTabs: FieldTabConfig<TFormValues>[];
  allTabs: TabConfig<TItem, TFormValues>[];
  activeTab: string;
  setActiveTab: (value: string) => void;
  Form: ComponentType<FormProps<TItem, TFormValues>>;
  readOnly?: boolean;
}

export function AddTabs<TItem, TFormValues extends FieldValues>({
  addTabs,
  allTabs,
  activeTab,
  setActiveTab,
  Form,
  readOnly,
}: AddTabsProps<TItem, TFormValues>) {
  const locale = useLocale();

  return (
    <CustomTabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="mt-2 w-full gap-0"
    >
      <div className="flex items-center gap-1 overflow-x-auto">
        <CustomTabsList>
          {addTabs.map((tab, index) => {
            const globalIndex = allTabs.findIndex((t) => t.value === tab.value);
            const displayIndex = globalIndex >= 0 ? globalIndex : index;
            return (
              <CustomTabsTrigger key={tab.value} value={tab.value}>
                <TabTriggerLabel
                  icon={tab.icon}
                  label={resolveLabel(tab.label, locale)}
                  index={displayIndex}
                />
              </CustomTabsTrigger>
            );
          })}
        </CustomTabsList>
      </div>
      {addTabs.map((tab) => (
        <CustomTabsContent key={tab.value} value={tab.value} className="py-6">
          <Form sections={tab.sections} readOnly={readOnly} />
        </CustomTabsContent>
      ))}
    </CustomTabs>
  );
}
