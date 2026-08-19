"use client";

import { Controller, useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

export function BooleanSelect({
  name,
  onOpenChange,
}: {
  name: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Common");
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          value={field.value ? "true" : "false"}
          onValueChange={(v) => field.onChange(v === "true")}
          onOpenChange={onOpenChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t("yes")}</SelectItem>
            <SelectItem value="false">{t("no")}</SelectItem>
          </SelectContent>
        </Select>
      )}
    />
  );
}
