"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/framework/components/dialog/BaseDialog";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";

export function AccessDeniedDialog({ resource }: { resource?: string }) {
  const t = useTranslations("AccessDenied");
  const router = useTransitionRouter();
  const goHome = () => router.push("/");

  return (
    <BaseDialog
      open
      setOpen={() => {}}
      onClose={goHome}
      title={t("title")}
      description={t("description", { resource: resource ?? t("thisPage") })}
      footer={<Button onClick={goHome}>{t("goBack")}</Button>}
    />
  );
}
