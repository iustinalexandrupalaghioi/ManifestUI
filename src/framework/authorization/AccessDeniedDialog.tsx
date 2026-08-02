"use client";

import { Button } from "@/framework/components/ui/button";
import { BaseDialog } from "@/framework/components/dialog/BaseDialog";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";

export function AccessDeniedDialog({ resource }: { resource: string }) {
  const router = useTransitionRouter();
  const goHome = () => router.push("/");

  return (
    <BaseDialog
      open
      setOpen={() => {}}
      onClose={goHome}
      title="Access denied"
      description={`You do not have access to ${resource}.`}
      footer={<Button onClick={goHome}>Go back</Button>}
    />
  );
}
