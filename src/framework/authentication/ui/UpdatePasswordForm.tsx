"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updatePassword } from "../actions/update-password";
import { FormPasswordInput } from "@/framework/components/form/form-fields/FormPasswordInput";

function makeFormSchema(t: ReturnType<typeof useTranslations<"AuthForms">>) {
  return z
    .object({
      password: z
        .string()
        .min(8, t("validation.passwordMinLength"))
        .regex(/[A-Z]/, t("validation.passwordUppercase"))
        .regex(/[0-9]/, t("validation.passwordNumber")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });
}

type FormSchema = z.infer<ReturnType<typeof makeFormSchema>>;

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("AuthForms");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formSchema = useMemo(() => makeFormSchema(t), [t]);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (values: FormSchema) => {
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(values.password);
      if (result && !result.ok) setError(result.error.message);
    });
  };

  return (
    <div
      className={cn("flex flex-col gap-6 max-w-96 mx-auto my-10", className)}
      {...props}
    >
      <Card>
        <CardHeader className="flex flex-col-reverse md:flex-row items-start justify-between md:items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">
              {t("updatePassword.title")}
            </CardTitle>
            <CardDescription>
              {t("updatePassword.description")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormPasswordInput<FormSchema>
                name="password"
                label={t("updatePassword.newPasswordLabel")}
                placeholder="••••••••••••"
              />
              <FormPasswordInput<FormSchema>
                name="confirmPassword"
                label={t("updatePassword.confirmPasswordLabel")}
                placeholder="••••••••••••"
              />

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending
                  ? t("updatePassword.submitting")
                  : t("updatePassword.submit")}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
