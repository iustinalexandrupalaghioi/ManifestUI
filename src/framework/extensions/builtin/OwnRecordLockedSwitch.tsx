"use client";

import { LockIcon } from "lucide-react";
import { z } from "zod";
import { currentUserId } from "@/framework/authorization/cache/currentUserId";
import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch";
import { defineFieldComponent } from "@/framework/extensions";

/**
 * A yes/no switch that's locked on the signed-in user's own record, e.g. the administrator
 * flag: nobody can take away their own access by mistake. The server should refuse it as well
 * (the resource's server rules).
 */
export const ownRecordLockedSwitch = defineFieldComponent({
  type: "ownRecordLockedSwitch",
  label: { en: "Switch, locked on your own record", ro: "Comutator blocat pe propria înregistrare" },
  icon: LockIcon,
  props: z.object({
    idField: z.string().default("id").describe("The record property holding the user id"),
  }),
  component: ({ id, value, onChange, disabled, readOnly, props, item }) => {
    const own = !!item && item[props.idField] === currentUserId();
    return (
      <CustomYesNoSwitch
        id={id}
        checked={value === true}
        onCheckedChange={(checked) => onChange(checked === true)}
        disabled={disabled || readOnly || own}
      />
    );
  },
});
