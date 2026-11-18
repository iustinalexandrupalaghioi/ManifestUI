"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { updatePassword } from "../actions/update-password";
import { FormPasswordInput } from "@/framework/components/form/form-fields/FormPasswordInput";
import { AuthCard, authPrimaryButton } from "./AuthCard";

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

export function UpdatePasswordForm(props: Omit<React.ComponentPropsWithoutRef<"div">, "title">) {
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
    <AuthCard title={t("updatePassword.title")} description={t("updatePassword.description")} {...props}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
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

          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <Button type="submit" className={authPrimaryButton} disabled={isPending}>
            {isPending ? t("updatePassword.submitting") : t("updatePassword.submit")}
          </Button>
        </form>
      </FormProvider>
    </AuthCard>
  );
}
