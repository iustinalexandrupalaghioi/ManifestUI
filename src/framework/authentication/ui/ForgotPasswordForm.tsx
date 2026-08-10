"use client";

import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormInput } from "@/framework/components/form/form-fields/FormInput";
import { cn } from "@/lib/utils";
import { forgotPassword } from "../actions/forgot-password";

function makeFormSchema(t: ReturnType<typeof useTranslations<"AuthForms">>) {
  return z.object({ email: z.email(t("validation.invalidEmail")) });
}

type FormSchema = z.infer<ReturnType<typeof makeFormSchema>>;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("AuthForms");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formSchema = useMemo(() => makeFormSchema(t), [t]);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: FormSchema) => {
    setError(null);
    startTransition(async () => {
      const result = await forgotPassword(values.email);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSuccess(true);
    });
  };

  if (success) {
    return (
      <div
        className={cn("flex flex-col gap-6 max-w-96 mx-auto my-10", className)}
        {...props}
      >
        <Card>
          <CardHeader className="flex flex-col-reverse md:flex-row items-start justify-between md:items-center gap-2">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl">
                {t("forgotPassword.successTitle")}
              </CardTitle>
              <CardDescription>
                {t("forgotPassword.successDescription")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("forgotPassword.successMessage")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-6 max-w-96 mx-auto my-10", className)}
      {...props}
    >
      <Card>
        <CardHeader className="flex flex-col-reverse md:flex-row items-start justify-between md:items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">
              {t("forgotPassword.title")}
            </CardTitle>
            <CardDescription>
              {t("forgotPassword.description")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormInput<FormSchema>
                name="email"
                label={t("forgotPassword.emailLabel")}
                type="email"
                placeholder={t("forgotPassword.emailPlaceholder")}
              />

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending
                  ? t("forgotPassword.submitting")
                  : t("forgotPassword.submit")}
              </Button>

              <div className="mt-4 text-center text-sm">
                {t("forgotPassword.rememberedPassword")}{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  {t("forgotPassword.loginLink")}
                </Link>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
